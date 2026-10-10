"""Main FastAPI Application Entrypoint for MindVault AI."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db
from app.api.routes import router as api_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("mindvault")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing MindVault database schema...")
    await init_db()
    
    # Check if vector index requires sync from stored database chunks
    try:
        from app.db.session import AsyncSessionLocal
        from app.models.entities import DocumentChunk
        from app.services.embedding_service import embedding_service
        from sqlalchemy import select

        if len(embedding_service.vectors) == 0:
            async with AsyncSessionLocal() as session:
                chunks = (await session.execute(select(DocumentChunk))).scalars().all()
                if chunks:
                    logger.info(f"Synchronizing vector store with {len(chunks)} database chunks...")
                    c_ids = [c.id for c in chunks]
                    c_texts = [c.content for c in chunks]
                    embedding_service.add_chunk_embeddings(c_ids, c_texts)
                    logger.info(f"Vector store synchronized successfully ({len(embedding_service.vectors)} vectors).")
    except Exception as e:
        logger.warning(f"Vector store startup synchronization warning: {e}")

    logger.info("MindVault AI backend initialized successfully.")
    yield
    # Shutdown actions
    logger.info("MindVault AI backend shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Your Personal Knowledge Intelligence Engine - Local-First AI Retrieval & Knowledge Graph",
    lifespan=lifespan,
)

# CORS configuration for local frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all endpoints under /api
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": "Your knowledge, connected. Your thinking, amplified.",
        "status": "online",
        "docs_url": "/docs"
    }
