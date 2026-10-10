"""Automated unit and integration tests for MindVault AI backend."""
import pytest
from pathlib import Path
from app.ingestion.pipeline import TextExtractor, DocumentChunker
from app.graph.extractor import GraphExtractor
from app.core.config import settings


def test_chunker_basic():
    pages = [
        {"page_number": 1, "text": "This is a sample document for testing the MindVault intelligence engine."}
    ]
    chunks = DocumentChunker.chunk_pages(pages, chunk_size=5, chunk_overlap=2)
    assert len(chunks) > 0
    assert chunks[0]["page_number"] == 1
    assert "MindVault" in chunks[0]["content"] or "sample" in chunks[0]["content"]


def test_rule_based_graph_extraction():
    sample_text = (
        "MindVault AI is built using FastAPI, PyMuPDF, and SentenceTransformers. "
        "It connects documents and extracts knowledge graphs using NetworkX."
    )
    result = GraphExtractor.rule_based_fallback(sample_text)
    assert "entities" in result
    assert "relationships" in result
    extracted_names = [e["name"] for e in result["entities"]]
    assert any("FastAPI" in name or "MindVault" in name for name in extracted_names)


def test_plaintext_extraction(tmp_path):
    test_file = tmp_path / "test_doc.md"
    test_file.write_text("# Knowledge Architecture\nDeep learning architectures rely on multi-layer perceptrons.", encoding="utf-8")
    
    pages, total_pages = TextExtractor.extract_file(test_file, "md")
    assert total_pages == 1
    assert "Knowledge Architecture" in pages[0]["text"]


def test_embedding_service_similarity():
    from app.services.embedding_service import embedding_service
    texts = [
        "Quantization compresses weights from float32 to int8.",
        "Convolutional layers process visual feature maps.",
        "Attention mechanisms correlate tokens across sequence contexts."
    ]
    chunk_ids = ["c1", "c2", "c3"]
    embedding_service.add_chunk_embeddings(chunk_ids, texts)
    
    results = embedding_service.search_similar("model quantization int8", top_k=2)
    assert len(results) > 0
    top_chunk_id, top_score = results[0]
    assert top_chunk_id == "c1"
    assert top_score > 0.0


@pytest.mark.asyncio
async def test_ollama_service_health():
    from app.services.ollama_service import ollama_service
    health = await ollama_service.check_health()
    assert "is_reachable" in health
    assert "selected_model" in health
    assert isinstance(health["is_reachable"], bool)

