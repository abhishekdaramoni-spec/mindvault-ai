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
