"""SQLAlchemy Relational Database Models for MindVault AI."""
import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    Float,
    Boolean,
    Enum,
)
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class Collection(Base):
    __tablename__ = "collections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    documents = relationship("Document", back_populates="collection", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(1024), nullable=False)
    file_type = Column(String(32), nullable=False)  # pdf, docx, txt, md
    file_size = Column(Integer, nullable=False)  # in bytes
    file_hash = Column(String(64), nullable=False)
    collection_id = Column(String(36), ForeignKey("collections.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(32), default="queued")  # queued, extracting, chunking, embedding, graph_extraction, indexed, failed
    error_message = Column(Text, nullable=True)
    total_pages = Column(Integer, default=1)
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    collection = relationship("Collection", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    entities = relationship("EntityProvenance", back_populates="document", cascade="all, delete-orphan")
    contradictions_a = relationship("ContradictionReview", foreign_keys="ContradictionReview.doc_a_id", cascade="all, delete-orphan")
    contradictions_b = relationship("ContradictionReview", foreign_keys="ContradictionReview.doc_b_id", cascade="all, delete-orphan")
    connections_a = relationship("ConnectionSuggestion", foreign_keys="ConnectionSuggestion.doc_a_id", cascade="all, delete-orphan")
    connections_b = relationship("ConnectionSuggestion", foreign_keys="ConnectionSuggestion.doc_b_id", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    char_start = Column(Integer, nullable=True)
    char_end = Column(Integer, nullable=True)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="chunks")
    citations = relationship("Citation", back_populates="chunk", cascade="all, delete-orphan")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, unique=True)
    category = Column(String(64), nullable=False, default="Topic")  # Person, Organization, Technology, Algorithm, Topic, Project, Location, Concept
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    provenances = relationship("EntityProvenance", back_populates="entity", cascade="all, delete-orphan")
    outgoing_relations = relationship("Relationship", foreign_keys="Relationship.source_id", back_populates="source_entity", cascade="all, delete-orphan")
    incoming_relations = relationship("Relationship", foreign_keys="Relationship.target_id", back_populates="target_entity", cascade="all, delete-orphan")


class EntityProvenance(Base):
    __tablename__ = "entity_provenances"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_id = Column(String(36), ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=True)
    excerpt = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)

    entity = relationship("Entity", back_populates="provenances")
    document = relationship("Document", back_populates="entities")


class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    relation_type = Column(String(64), nullable=False)  # RELATED_TO, USES, PART_OF, DEPENDS_ON, CONTRADICTS, MENTIONS
    description = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    source_entity = relationship("Entity", foreign_keys=[source_id], back_populates="outgoing_relations")
    target_entity = relationship("Entity", foreign_keys=[target_id], back_populates="incoming_relations")
    evidences = relationship("RelationshipEvidence", back_populates="relationship", cascade="all, delete-orphan")


class RelationshipEvidence(Base):
    __tablename__ = "relationship_evidences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    relationship_id = Column(String(36), ForeignKey("relationships.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_id = Column(String(36), ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=True)
    excerpt = Column(Text, nullable=False)

    relationship = relationship("Relationship", back_populates="evidences")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), default="New Research Session")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(16), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
    citations = relationship("Citation", back_populates="message", cascade="all, delete-orphan")


class Citation(Base):
    __tablename__ = "citations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    chunk_id = Column(String(36), ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False)
    document_title = Column(String(255), nullable=False)
    page_number = Column(Integer, nullable=True)
    excerpt = Column(Text, nullable=False)
    score = Column(Float, default=0.0)

    message = relationship("Message", back_populates="citations")
    chunk = relationship("DocumentChunk", back_populates="citations")


class ConnectionSuggestion(Base):
    __tablename__ = "connection_suggestions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    doc_a_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    doc_b_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    shared_concept = Column(String(255), nullable=True)
    reasoning = Column(Text, nullable=False)
    excerpt_a = Column(Text, nullable=False)
    excerpt_b = Column(Text, nullable=False)
    confidence = Column(Float, default=0.85)
    status = Column(String(32), default="suggested")  # suggested, accepted, dismissed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ContradictionReview(Base):
    __tablename__ = "contradiction_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    doc_a_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    doc_b_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String(255), nullable=False)
    claim_a = Column(Text, nullable=False)
    claim_b = Column(Text, nullable=False)
    classification = Column(String(64), default="potential_contradiction")  # potential_contradiction, contextual_difference, insufficient_evidence
    status = Column(String(32), default="needs_review")  # needs_review, confirmed, dismissed
    reasoning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class KnowledgeGapSuggestion(Base):
    __tablename__ = "knowledge_gap_suggestions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    topic = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False)  # unexplained_concept, unanswered_question, weak_connectivity, isolated_topic
    why_identified = Column(Text, nullable=False)
    supporting_excerpt = Column(Text, nullable=True)
    related_concepts = Column(String(512), nullable=True)  # comma separated
    suggested_follow_up = Column(Text, nullable=False)
    confidence = Column(Float, default=0.8)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class UserSetting(Base):
    __tablename__ = "user_settings"

    key = Column(String(128), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
