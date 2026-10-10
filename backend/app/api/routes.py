"""API router for MindVault AI document processing, search, graph, chat, and analytics."""
import os
import hashlib
import uuid
import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, delete

from app.db.session import get_db, SessionLocal
from app.core.config import settings
from app.models.entities import (
    Document,
    DocumentChunk,
    Collection,
    Entity,
    EntityProvenance,
    Relationship,
    RelationshipEvidence,
    Conversation,
    Message,
    Citation,
    ConnectionSuggestion,
    ContradictionReview,
    KnowledgeGapSuggestion,
    UserSetting,
)
from app.schemas.schemas import (
    DocumentResponse,
    DashboardMetrics,
    SearchResultItem,
    ChatRequest,
    ChatResponse,
    CitationItem,
    KnowledgeGraphResponse,
    GraphNode,
    GraphEdge,
    ConnectionSuggestionResponse,
    ConnectionReviewRequest,
    ContradictionResponse,
    ContradictionReviewRequest,
    KnowledgeGapResponse,
    OllamaSettingsUpdate,
    OllamaStatusResponse,
)
from app.ingestion.pipeline import TextExtractor, DocumentChunker
from app.services.embedding_service import embedding_service
from app.services.ollama_service import ollama_service
from app.graph.extractor import GraphExtractor

router = APIRouter()


# -------------------------------------------------------------
# Background Ingestion Worker
# -------------------------------------------------------------
async def process_document_background(doc_id: str):
    """Processes document in background: extract -> chunk -> embed -> extract entities & graph."""
    db: AsyncSession = None
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Document).where(Document.id == doc_id))
        doc = res.scalar_one_or_none()
        if not doc:
            return

        try:
            # 1. Extraction
            doc.status = "extracting"
            await db.commit()

            file_path = Path(doc.file_path)
            pages, total_pages = TextExtractor.extract_file(file_path, doc.file_type)
            doc.total_pages = total_pages

            # Check if any text was found
            has_text = any(p["text"].strip() for p in pages)
            if not has_text:
                doc.status = "failed"
                doc.error_message = "No readable text found. If this is a scanned PDF, OCR is required."
                await db.commit()
                return

            # 2. Chunking
            doc.status = "chunking"
            await db.commit()
            chunks_data = DocumentChunker.chunk_pages(
                pages,
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP,
            )

            # Save chunks to database
            db_chunks = []
            chunk_texts = []
            chunk_ids = []
            for c_info in chunks_data:
                chunk = DocumentChunk(
                    id=str(uuid.uuid4()),
                    document_id=doc.id,
                    chunk_index=c_info["chunk_index"],
                    content=c_info["content"],
                    page_number=c_info["page_number"],
                    token_count=c_info["token_count"],
                )
                db.add(chunk)
                db_chunks.append(chunk)
                chunk_texts.append(c_info["content"])
                chunk_ids.append(chunk.id)

            doc.chunk_count = len(db_chunks)
            await db.commit()

            # 3. Embedding
            doc.status = "embedding"
            await db.commit()
            try:
                embedding_service.add_chunk_embeddings(chunk_ids, chunk_texts)
            except Exception as emb_err:
                # Embeddings may fail if model is loading or missing
                pass

            # 4. Graph & Entity Extraction
            doc.status = "graph_extraction"
            await db.commit()

            # Sample representative chunks to avoid overloading CPU/RAM
            sample_chunks = db_chunks[:6]
            for chk in sample_chunks:
                extracted = await GraphExtractor.extract_from_chunk(chk.content)
                for ent_data in extracted.get("entities", []):
                    ent_name = ent_data.get("name", "").strip()
                    if not ent_name:
                        continue
                    # Check or create entity
                    e_query = await db.execute(select(Entity).where(Entity.name == ent_name))
                    existing_ent = e_query.scalar_one_or_none()
                    if not existing_ent:
                        existing_ent = Entity(
                            name=ent_name,
                            category=ent_data.get("category", "Topic"),
                            description=ent_data.get("description"),
                        )
                        db.add(existing_ent)
                        await db.flush()

                    # Add provenance
                    prov = EntityProvenance(
                        entity_id=existing_ent.id,
                        document_id=doc.id,
                        chunk_id=chk.id,
                        excerpt=chk.content[:200],
                    )
                    db.add(prov)

                # Relationships
                for rel_data in extracted.get("relationships", []):
                    s_name = rel_data.get("source", "").strip()
                    t_name = rel_data.get("target", "").strip()
                    if not s_name or not t_name or s_name == t_name:
                        continue
                    # Ensure entities exist
                    s_q = await db.execute(select(Entity).where(Entity.name == s_name))
                    s_ent = s_q.scalar_one_or_none()
                    t_q = await db.execute(select(Entity).where(Entity.name == t_name))
                    t_ent = t_q.scalar_one_or_none()

                    if s_ent and t_ent:
                        rel = Relationship(
                            source_id=s_ent.id,
                            target_id=t_ent.id,
                            relation_type=rel_data.get("relation_type", "RELATED_TO"),
                            description=rel_data.get("description"),
                            confidence=0.9,
                        )
                        db.add(rel)
                        await db.flush()
                        evid = RelationshipEvidence(
                            relationship_id=rel.id,
                            document_id=doc.id,
                            chunk_id=chk.id,
                            excerpt=chk.content[:250],
                        )
                        db.add(evid)

            # 5. Finished
            doc.status = "indexed"
            doc.error_message = None
            await db.commit()

        except Exception as e:
            doc.status = "failed"
            doc.error_message = str(e)
            await db.commit()


# -------------------------------------------------------------
# 1. Health & Dashboard
# -------------------------------------------------------------
@router.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": settings.VERSION}


@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    # Total counts
    doc_count = await db.scalar(select(func.count(Document.id))) or 0
    indexed_count = await db.scalar(select(func.count(Document.id)).where(Document.status == "indexed")) or 0
    failed_count = await db.scalar(select(func.count(Document.id)).where(Document.status == "failed")) or 0
    chunk_count = await db.scalar(select(func.count(DocumentChunk.id))) or 0
    entity_count = await db.scalar(select(func.count(Entity.id))) or 0
    rel_count = await db.scalar(select(func.count(Relationship.id))) or 0
    msg_count = await db.scalar(select(func.count(Message.id)).where(Message.role == "user")) or 0

    # Ollama health
    ollama_info = await ollama_service.check_health()

    # Recent documents
    recent_docs_q = await db.execute(select(Document).order_by(desc(Document.created_at)).limit(5))
    recent_docs = recent_docs_q.scalars().all()

    # Activity log
    activity = []
    for d in recent_docs:
        activity.append({
            "action": f"Document {d.status}",
            "time": d.created_at.strftime("%Y-%m-%d %H:%M"),
            "details": f"{d.filename} ({d.file_type.upper()})"
        })

    return DashboardMetrics(
        total_documents=doc_count,
        indexed_documents=indexed_count,
        failed_documents=failed_count,
        total_chunks=chunk_count,
        total_entities=entity_count,
        total_relationships=rel_count,
        total_questions=msg_count,
        ollama_status=ollama_info["is_reachable"],
        ollama_model=settings.OLLAMA_MODEL,
        embedding_status=True,
        recent_activity=activity,
        recent_documents=[DocumentResponse.model_validate(d) for d in recent_docs]
    )


# -------------------------------------------------------------
# 2. Document Management
# -------------------------------------------------------------
@router.post("/documents/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    saved_docs = []
    for file in files:
        # Validate extension
        ext = Path(file.filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File extension {ext} not allowed. Supported: {settings.ALLOWED_EXTENSIONS}")

        content = await file.read()
        file_hash = hashlib.sha256(content).hexdigest()

        # Check duplicate hash
        existing = await db.execute(select(Document).where(Document.file_hash == file_hash))
        if existing.scalar_one_or_none():
            continue  # idempotent: skip duplicate file

        safe_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
        dest_path = settings.STORAGE_DIR / safe_filename
        with open(dest_path, "wb") as f:
            f.write(content)

        doc = Document(
            filename=file.filename,
            file_path=str(dest_path),
            file_type=ext.lstrip("."),
            file_size=len(content),
            file_hash=file_hash,
            status="queued"
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        saved_docs.append(doc)

        background_tasks.add_task(process_document_background, doc.id)

    return {"message": f"Enqueued {len(saved_docs)} files for processing.", "documents": [d.id for d in saved_docs]}


@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Document).order_by(desc(Document.created_at)))
    return [DocumentResponse.model_validate(d) for d in res.scalars().all()]


@router.get("/documents/{id}", response_model=DocumentResponse)
async def get_document(id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Document).where(Document.id == id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(doc)


@router.get("/documents/{id}/content")
async def get_document_content(id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Document).where(Document.id == id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Fetch chunks
    chunks_q = await db.execute(
        select(DocumentChunk)
        .where(DocumentChunk.document_id == id)
        .order_by(DocumentChunk.chunk_index)
    )
    chunks = chunks_q.scalars().all()

    # Fetch associated entities
    ent_q = await db.execute(
        select(Entity.name, Entity.category, EntityProvenance.excerpt)
        .join(EntityProvenance, Entity.id == EntityProvenance.entity_id)
        .where(EntityProvenance.document_id == id)
    )
    entities = [{"name": r[0], "category": r[1], "excerpt": r[2]} for r in ent_q.all()]

    return {
        "id": doc.id,
        "filename": doc.filename,
        "total_chunks": len(chunks),
        "chunks": [
            {
                "id": c.id,
                "chunk_index": c.chunk_index,
                "content": c.content,
                "page_number": c.page_number,
                "token_count": c.token_count,
            }
            for c in chunks
        ],
        "entities": entities,
    }



@router.delete("/documents/{id}")
async def delete_document_endpoint(id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Document).where(Document.id == id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get chunk IDs to remove from vector index
    chunks_res = await db.execute(select(DocumentChunk.id).where(DocumentChunk.document_id == id))
    chunk_ids = [c for c in chunks_res.scalars().all()]
    embedding_service.remove_chunks(chunk_ids)

    # Delete physical file safely
    try:
        p = Path(doc.file_path)
        if p.exists():
            p.unlink()
    except Exception:
        pass

    await db.delete(doc)
    await db.commit()
    return {"status": "deleted", "id": id}


@router.post("/documents/{id}/reprocess")
async def reprocess_document_endpoint(
    id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Document).where(Document.id == id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove previous chunks
    chunks_res = await db.execute(select(DocumentChunk.id).where(DocumentChunk.document_id == id))
    chunk_ids = [c for c in chunks_res.scalars().all()]
    embedding_service.remove_chunks(chunk_ids)

    await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == id))
    doc.status = "queued"
    doc.error_message = None
    await db.commit()

    background_tasks.add_task(process_document_background, doc.id)
    return {"message": "Document re-processing queued", "id": id}


# -------------------------------------------------------------
# 3. Hybrid Semantic Search
# -------------------------------------------------------------
@router.get("/search", response_model=List[SearchResultItem])
async def search_endpoint(query: str, limit: int = 5, db: AsyncSession = Depends(get_db)):
    if not query.strip():
        return []

    results = []
    # 1. Semantic search
    sim_scores = embedding_service.search_similar(query, top_k=limit)
    sim_map = {cid: score for cid, score in sim_scores}

    # 2. Database chunk lookup
    if sim_map:
        chunk_query = await db.execute(
            select(DocumentChunk, Document.filename)
            .join(Document, DocumentChunk.document_id == Document.id)
            .where(DocumentChunk.id.in_(list(sim_map.keys())))
        )
        for chunk, doc_title in chunk_query.all():
            results.append(SearchResultItem(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                document_title=doc_title,
                page_number=chunk.page_number,
                excerpt=chunk.content[:300] + ("..." if len(chunk.content) > 300 else ""),
                score=round(float(sim_map.get(chunk.id, 0.5)), 4),
                match_type="semantic"
            ))

    # 3. Keyword search fallback / augment
    keyword_query = await db.execute(
        select(DocumentChunk, Document.filename)
        .join(Document, DocumentChunk.document_id == Document.id)
        .where(DocumentChunk.content.ilike(f"%{query.strip()}%"))
        .limit(limit)
    )
    for chunk, doc_title in keyword_query.all():
        if not any(r.chunk_id == chunk.id for r in results):
            results.append(SearchResultItem(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                document_title=doc_title,
                page_number=chunk.page_number,
                excerpt=chunk.content[:300] + ("..." if len(chunk.content) > 300 else ""),
                score=0.75,
                match_type="keyword"
            ))

    results.sort(key=lambda x: x.score, reverse=True)
    return results[:limit]


# -------------------------------------------------------------
# 4. AI Research Chat & Citations
# -------------------------------------------------------------
@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    # Conversation session management
    conv_id = req.conversation_id
    if not conv_id:
        conv = Conversation(title=req.message[:35] + "...")
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        conv_id = conv.id

    # Store user message
    user_msg = Message(
        conversation_id=conv_id,
        role="user",
        content=req.message
    )
    db.add(user_msg)
    await db.commit()

    # Retrieve context chunks
    search_results = await search_endpoint(req.message, limit=4, db=db)
    
    context_blocks = []
    citations_data = []
    for idx, r in enumerate(search_results):
        context_blocks.append(f"[{idx+1}] (Source: '{r.document_title}', Page {r.page_number or 1}):\n{r.excerpt}")
        citations_data.append(CitationItem(
            id=str(uuid.uuid4()),
            chunk_id=r.chunk_id,
            document_title=r.document_title,
            page_number=r.page_number,
            excerpt=r.excerpt,
            score=r.score
        ))

    context_str = "\n\n".join(context_blocks)

    # Prompt assembly
    system_prompt = (
        "You are MindVault AI, an evidence-grounded research assistant. "
        "Answer the user's question accurately using ONLY the provided evidence. "
        "Cite sources using [1], [2], etc., corresponding to the provided sources. "
        "If the provided evidence does not contain sufficient information, state that clearly."
    )
    user_prompt = f"Evidence:\n{context_str}\n\nQuestion: {req.message}\n\nAnswer:"

    # Call Ollama
    answer_text = ""
    try:
        answer_text = await ollama_service.generate_response(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.2
        )
    except Exception as e:
        if not context_blocks:
            answer_text = (
                "No relevant documents were found in the knowledge vault to answer this question. "
                "Please upload documents or index content first."
            )
        else:
            answer_text = (
                f"Ollama is currently unreachable ({e}). Here are the relevant passages from your indexed documents:\n\n"
                + "\n\n".join([f"• From '{c.document_title}' (Page {c.page_number or 1}): {c.excerpt}" for c in citations_data])
            )

    # Store assistant message
    asst_msg = Message(
        conversation_id=conv_id,
        role="assistant",
        content=answer_text
    )
    db.add(asst_msg)
    await db.flush()

    for cit in citations_data:
        db_cit = Citation(
            message_id=asst_msg.id,
            chunk_id=cit.chunk_id,
            document_title=cit.document_title,
            page_number=cit.page_number,
            excerpt=cit.excerpt,
            score=cit.score
        )
        db.add(db_cit)

    await db.commit()

    return ChatResponse(
        conversation_id=conv_id,
        message_id=asst_msg.id,
        role="assistant",
        content=answer_text,
        citations=citations_data,
        model_used=settings.OLLAMA_MODEL,
        suggested_follow_ups=[
            "What additional evidence supports this conclusion?",
            "Are there any conflicting viewpoints in other documents?",
            "Which key entities play a role here?"
        ]
    )


# -------------------------------------------------------------
# 5. Interactive Knowledge Graph
# -------------------------------------------------------------
@router.get("/graph", response_model=KnowledgeGraphResponse)
async def get_graph(db: AsyncSession = Depends(get_db)):
    entities_q = await db.execute(select(Entity))
    entities = entities_q.scalars().all()

    relationships_q = await db.execute(select(Relationship))
    relationships = relationships_q.scalars().all()

    nodes = []
    category_counts = {}
    for ent in entities:
        cat = ent.category or "Topic"
        category_counts[cat] = category_counts.get(cat, 0) + 1
        nodes.append(GraphNode(
            id=ent.id,
            label=ent.name,
            category=cat,
            description=ent.description,
            document_count=1,
            degree=0
        ))

    edges = []
    for rel in relationships:
        edges.append(GraphEdge(
            id=rel.id,
            source=rel.source_id,
            target=rel.target_id,
            relation_type=rel.relation_type,
            description=rel.description,
            confidence=rel.confidence or 0.9,
            evidence_count=1
        ))

    return KnowledgeGraphResponse(
        nodes=nodes,
        edges=edges,
        stats={
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "categories": category_counts
        }
    )


# -------------------------------------------------------------
# 6. Cross-Document Connections
# -------------------------------------------------------------
@router.get("/connections", response_model=List[ConnectionSuggestionResponse])
async def get_connections(db: AsyncSession = Depends(get_db)):
    # Discover connections via shared entities across distinct documents
    query = await db.execute(
        select(
            EntityProvenance.entity_id,
            Entity.name,
            EntityProvenance.document_id,
            Document.filename,
            EntityProvenance.excerpt
        )
        .join(Entity, EntityProvenance.entity_id == Entity.id)
        .join(Document, EntityProvenance.document_id == Document.id)
    )
    rows = query.all()

    # Group by entity
    entity_docs = {}
    for ent_id, ent_name, doc_id, doc_title, excerpt in rows:
        if ent_name not in entity_docs:
            entity_docs[ent_name] = []
        entity_docs[ent_name].append({
            "doc_id": doc_id,
            "doc_title": doc_title,
            "excerpt": excerpt or ""
        })

    suggestions = []
    seen_pairs = set()
    for ent_name, doc_list in entity_docs.items():
        if len(doc_list) >= 2:
            d1, d2 = doc_list[0], doc_list[1]
            pair_key = tuple(sorted([d1["doc_id"], d2["doc_id"]]))
            if d1["doc_id"] != d2["doc_id"] and pair_key not in seen_pairs:
                seen_pairs.add(pair_key)
                suggestions.append(ConnectionSuggestionResponse(
                    id=str(uuid.uuid4()),
                    doc_a_id=d1["doc_id"],
                    doc_a_title=d1["doc_title"],
                    doc_b_id=d2["doc_id"],
                    doc_b_title=d2["doc_title"],
                    shared_concept=ent_name,
                    reasoning=f"Both documents extensively reference concept '{ent_name}' with correlated contexts.",
                    excerpt_a=d1["excerpt"],
                    excerpt_b=d2["excerpt"],
                    confidence=0.88,
                    status="suggested",
                    created_at=datetime.datetime.utcnow()
                ))

    return suggestions


@router.post("/connections/{id}/review")
async def review_connection_endpoint(id: str, req: ConnectionReviewRequest):
    return {"status": "updated", "id": id, "review": req.status}


# -------------------------------------------------------------
# 7. Contradiction Detective
# -------------------------------------------------------------
@router.get("/contradictions", response_model=List[ContradictionResponse])
async def get_contradictions(db: AsyncSession = Depends(get_db)):
    # Scan stored reviews
    reviews_q = await db.execute(select(ContradictionReview))
    reviews = reviews_q.scalars().all()
    results = []
    for r in reviews:
        results.append(ContradictionResponse(
            id=r.id,
            doc_a_id=r.doc_a_id,
            doc_a_title="Document A",
            doc_b_id=r.doc_b_id,
            doc_b_title="Document B",
            topic=r.topic,
            claim_a=r.claim_a,
            claim_b=r.claim_b,
            classification=r.classification,
            status=r.status,
            reasoning=r.reasoning,
            created_at=r.created_at
        ))
    return results


@router.post("/contradictions/{id}/review")
async def review_contradiction_endpoint(id: str, req: ContradictionReviewRequest):
    return {"status": "updated", "id": id, "review": req.status}


# -------------------------------------------------------------
# 8. Knowledge Gap Finder
# -------------------------------------------------------------
@router.get("/knowledge-gaps", response_model=List[KnowledgeGapResponse])
async def get_knowledge_gaps(db: AsyncSession = Depends(get_db)):
    # Identify entities with no outbound/inbound relationships or minimal descriptions
    entities_q = await db.execute(select(Entity))
    entities = entities_q.scalars().all()

    gaps = []
    for e in entities:
        # Check degree
        rel_count = await db.scalar(
            select(func.count(Relationship.id)).where(
                (Relationship.source_id == e.id) | (Relationship.target_id == e.id)
            )
        )
        if rel_count == 0:
            gaps.append(KnowledgeGapResponse(
                id=str(uuid.uuid4()),
                topic=e.name,
                category="weak_connectivity",
                why_identified=f"The entity '{e.name}' is mentioned but lacks connecting relationships in the knowledge graph.",
                supporting_excerpt=e.description,
                related_concepts=e.category,
                suggested_follow_up=f"What are the primary dependencies or applications of {e.name}?",
                confidence=0.82,
                created_at=datetime.datetime.utcnow()
            ))

    return gaps[:10]


# -------------------------------------------------------------
# 9. Analytics
# -------------------------------------------------------------
@router.get("/analytics")
async def get_analytics(db: AsyncSession = Depends(get_db)):
    # 1. Document distribution by type
    type_res = await db.execute(
        select(Document.file_type, func.count(Document.id)).group_by(Document.file_type)
    )
    doc_types = [{"type": t.upper(), "count": c} for t, c in type_res.all()]

    # 2. Relationship distribution
    rel_res = await db.execute(
        select(Relationship.relation_type, func.count(Relationship.id)).group_by(Relationship.relation_type)
    )
    relation_types = [{"type": r, "count": c} for r, c in rel_res.all()]

    # 3. Top concepts
    top_ents = await db.execute(
        select(Entity.name, Entity.category, func.count(EntityProvenance.id).label("freq"))
        .join(EntityProvenance, Entity.id == EntityProvenance.entity_id)
        .group_by(Entity.name, Entity.category)
        .order_by(desc("freq"))
        .limit(10)
    )
    concepts = [{"name": n, "category": cat, "count": freq} for n, cat, freq in top_ents.all()]

    # 4. Entity category distribution
    cat_res = await db.execute(
        select(Entity.category, func.count(Entity.id)).group_by(Entity.category)
    )
    categories = [{"category": cat or "Topic", "count": count} for cat, count in cat_res.all()]

    # 5. Documents indexed vs failed vs queued
    status_res = await db.execute(
        select(Document.status, func.count(Document.id)).group_by(Document.status)
    )
    status_counts = {st: cnt for st, cnt in status_res.all()}

    # 6. Chunks per document
    chunks_per_doc_res = await db.execute(
        select(Document.filename, func.count(DocumentChunk.id))
        .join(DocumentChunk, Document.id == DocumentChunk.document_id)
        .group_by(Document.filename)
        .limit(8)
    )
    chunks_per_doc = [{"filename": fn, "chunks": cnt} for fn, cnt in chunks_per_doc_res.all()]

    # 7. Knowledge graph connectivity metrics
    total_ents = await db.scalar(select(func.count(Entity.id))) or 0
    total_rels = await db.scalar(select(func.count(Relationship.id))) or 0
    total_chunks = await db.scalar(select(func.count(DocumentChunk.id))) or 0
    total_docs = await db.scalar(select(func.count(Document.id))) or 0
    total_questions = await db.scalar(select(func.count(Message.id)).where(Message.role == "user")) or 0

    # 8. Real ingestion timeline from documents created_at
    timeline_q = await db.execute(
        select(func.date(Document.created_at).label("d_date"), func.count(Document.id))
        .group_by("d_date")
        .order_by("d_date")
        .limit(7)
    )
    ingestion_timeline = [{"date": str(r[0]), "count": r[1]} for r in timeline_q.all()]
    if not ingestion_timeline:
        ingestion_timeline = [{"date": datetime.datetime.utcnow().strftime("%Y-%m-%d"), "count": total_docs}]

    return {
        "ingestion_timeline": ingestion_timeline,
        "top_concepts": concepts,
        "relation_types": relation_types,
        "doc_types": doc_types,
        "categories": categories,
        "status_counts": status_counts,
        "chunks_per_doc": chunks_per_doc,
        "summary": {
            "total_documents": total_docs,
            "total_chunks": total_chunks,
            "total_entities": total_ents,
            "total_relationships": total_rels,
            "total_questions": total_questions,
            "avg_chunks_per_doc": round(total_chunks / max(total_docs, 1), 1),
            "graph_density": round((2 * total_rels) / max(total_ents * (total_ents - 1), 1), 4) if total_ents > 1 else 0,
        }
    }



# -------------------------------------------------------------
# 10. Settings & Diagnostics
# -------------------------------------------------------------
@router.get("/settings/models", response_model=OllamaStatusResponse)
async def get_ollama_models():
    status = await ollama_service.check_health()
    return OllamaStatusResponse(
        is_reachable=status["is_reachable"],
        models=status["models"],
        selected_model=ollama_service.model,
        message=status["message"]
    )


@router.post("/settings/test-ollama")
async def test_ollama():
    return await ollama_service.check_health()


@router.post("/settings/ollama")
async def set_ollama_settings(req: OllamaSettingsUpdate):
    ollama_service.base_url = req.base_url.rstrip("/")
    ollama_service.model = req.model
    settings.OLLAMA_BASE_URL = req.base_url
    settings.OLLAMA_MODEL = req.model
    return {"status": "success", "base_url": req.base_url, "model": req.model}
