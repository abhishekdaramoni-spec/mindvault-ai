"""Configuration management for MindVault AI."""
from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
INDEXES_DIR = DATA_DIR / "indexes"
DB_PATH = DATA_DIR / "mindvault.db"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
INDEXES_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    PROJECT_NAME: str = "MindVault AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DB_PATH.as_posix()}"
    SYNC_DATABASE_URL: str = f"sqlite:///{DB_PATH.as_posix()}"

    # Storage paths
    STORAGE_DIR: Path = UPLOADS_DIR
    INDEX_DIR: Path = INDEXES_DIR

    # Ollama Local AI Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"
    OLLAMA_TIMEOUT_SECONDS: float = 60.0

    # Embeddings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 80

    # Upload limitations
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: set[str] = {".pdf", ".docx", ".txt", ".md"}

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
