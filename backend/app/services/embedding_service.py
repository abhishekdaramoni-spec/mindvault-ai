"""Vector embedding engine using Sentence Transformers with fallback caching and cosine similarity."""
import os
import json
import logging
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self._model = None
        self._index_file = settings.INDEX_DIR / "vector_index.json"
        # In-memory vector store: list of dicts: {"chunk_id": str, "vector": list[float]}
        self.vectors: Dict[str, np.ndarray] = {}
        self._load_cached_index()

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading SentenceTransformer model: {self.model_name}")
                self._model = SentenceTransformer(self.model_name)
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer: {e}")
                raise RuntimeError(f"Could not load embedding model: {e}")
        return self._model

    def _load_cached_index(self):
        if self._index_file.exists():
            try:
                with open(self._index_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for chunk_id, vec in data.items():
                        self.vectors[chunk_id] = np.array(vec, dtype=np.float32)
                logger.info(f"Loaded {len(self.vectors)} vector embeddings from cache.")
            except Exception as e:
                logger.warning(f"Could not read cached vector index: {e}")

    def save_index(self):
        try:
            settings.INDEX_DIR.mkdir(parents=True, exist_ok=True)
            export_data = {k: v.tolist() for k, v in self.vectors.items()}
            with open(self._index_file, "w", encoding="utf-8") as f:
                json.dump(export_data, f)
        except Exception as e:
            logger.error(f"Failed to save vector index to disk: {e}")

    def embed_texts(self, texts: List[str]) -> List[np.ndarray]:
        """Compute normalized vector embeddings for a list of texts."""
        if not texts:
            return []
        model = self._get_model()
        embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return [np.array(e, dtype=np.float32) for e in embeddings]

    def embed_query(self, query: str) -> np.ndarray:
        """Compute normalized embedding for a search query."""
        model = self._get_model()
        vec = model.encode([query], normalize_embeddings=True, show_progress_bar=False)[0]
        return np.array(vec, dtype=np.float32)

    def add_chunk_embeddings(self, chunk_ids: List[str], texts: List[str]):
        """Embed and store chunk vectors."""
        if not chunk_ids or not texts:
            return
        embeddings = self.embed_texts(texts)
        for cid, emb in zip(chunk_ids, embeddings):
            self.vectors[cid] = emb
        self.save_index()

    def remove_chunks(self, chunk_ids: List[str]):
        """Remove chunk vectors when document is deleted."""
        changed = False
        for cid in chunk_ids:
            if cid in self.vectors:
                del self.vectors[cid]
                changed = True
        if changed:
            self.save_index()

    def search_similar(self, query: str, top_k: int = 5, candidate_chunk_ids: Optional[List[str]] = None) -> List[Tuple[str, float]]:
        """Perform exact cosine similarity search across stored vectors."""
        if not self.vectors:
            return []

        query_vec = self.embed_query(query)
        target_ids = list(self.vectors.keys()) if candidate_chunk_ids is None else [cid for cid in candidate_chunk_ids if cid in self.vectors]

        if not target_ids:
            return []

        scores = []
        for cid in target_ids:
            chunk_vec = self.vectors[cid]
            # Since normalized, dot product equals cosine similarity
            similarity = float(np.dot(query_vec, chunk_vec))
            scores.append((cid, similarity))

        # Sort descending by score
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]


embedding_service = EmbeddingService()
