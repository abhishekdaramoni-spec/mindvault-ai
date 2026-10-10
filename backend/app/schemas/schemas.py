"""Pydantic schemas for MindVault AI API request and response bodies."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# --- Documents & Collections ---
class CollectionBase(BaseModel):
    name: str
    description: Optional[str] = None

class CollectionCreate(CollectionBase):
    pass

class CollectionResponse(CollectionBase):
    id: str
    created_at: datetime
    document_count: Optional[int] = 0

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    collection_id: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    total_pages: int
    chunk_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentChunkResponse(BaseModel):
    id: str
    document_id: str
    chunk_index: int
    content: str
    page_number: Optional[int] = None
    token_count: int

    class Config:
        from_attributes = True


# --- Dashboard ---
class DashboardMetrics(BaseModel):
    total_documents: int
    indexed_documents: int
    failed_documents: int
    total_chunks: int
    total_entities: int
    total_relationships: int
    total_questions: int
    ollama_status: bool
    ollama_model: str
    embedding_status: bool
    recent_activity: List[Dict[str, Any]]
    recent_documents: List[DocumentResponse]


# --- Search & Retrieval ---
class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5
    collection_id: Optional[str] = None


class SearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    page_number: Optional[int] = None
    excerpt: str
    score: float
    match_type: str  # semantic, keyword, or hybrid


# --- Chat & QA ---
class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str


class CitationItem(BaseModel):
    id: str
    chunk_id: str
    document_title: str
    page_number: Optional[int] = None
    excerpt: str
    score: float


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    role: str
    content: str
    citations: List[CitationItem]
    model_used: str
    suggested_follow_ups: List[str]


# --- Knowledge Graph ---
class GraphNode(BaseModel):
    id: str
    label: str
    category: str
    description: Optional[str] = None
    document_count: int = 1
    degree: int = 0


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relation_type: str
    description: Optional[str] = None
    confidence: float
    evidence_count: int = 1


class KnowledgeGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, Any]


class NodeProvenanceItem(BaseModel):
    document_id: str
    document_title: str
    excerpt: Optional[str] = None
    page_number: Optional[int] = None


# --- Cross-Document Connections ---
class ConnectionReviewRequest(BaseModel):
    status: str  # accepted, dismissed


class ConnectionSuggestionResponse(BaseModel):
    id: str
    doc_a_id: str
    doc_a_title: str
    doc_b_id: str
    doc_b_title: str
    shared_concept: Optional[str] = None
    reasoning: str
    excerpt_a: str
    excerpt_b: str
    confidence: float
    status: str
    created_at: datetime


# --- Contradictions ---
class ContradictionReviewRequest(BaseModel):
    status: str  # confirmed, dismissed, needs_review


class ContradictionResponse(BaseModel):
    id: str
    doc_a_id: str
    doc_a_title: str
    doc_b_id: str
    doc_b_title: str
    topic: str
    claim_a: str
    claim_b: str
    classification: str
    status: str
    reasoning: Optional[str] = None
    created_at: datetime


# --- Knowledge Gaps ---
class KnowledgeGapResponse(BaseModel):
    id: str
    topic: str
    category: str
    why_identified: str
    supporting_excerpt: Optional[str] = None
    related_concepts: Optional[str] = None
    suggested_follow_up: str
    confidence: float
    created_at: datetime


# --- Settings ---
class OllamaSettingsUpdate(BaseModel):
    base_url: str
    model: str


class OllamaStatusResponse(BaseModel):
    is_reachable: bool
    models: List[str]
    selected_model: str
    message: Optional[str] = None
