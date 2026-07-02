"""
app/core/config.py
------------------
Central configuration loaded from environment variables.
Pydantic-settings validates types and raises clear errors on startup
if anything required is missing.
"""

from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator
from typing import List
import secrets


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────
    APP_NAME: str = "StudyFlow AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # ── Security ─────────────────────────────────────────────
    SECRET_KEY: str = secrets.token_hex(32)   # overridden by .env in prod
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://studyflow:studyflow_secret@localhost:5432/studyflow_db"

    # ── ChromaDB ─────────────────────────────────────────────
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_AUTH_TOKEN: str = "studyflow_chroma_token"

    # ── Groq  ─────────────────────────────────────────
    GROQ_API_KEY: str = ""

    # ── File Storage ─────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50

    # ── CORS ─────────────────────────────────────────────────
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        # Accepts both a JSON list or a comma-separated string
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    class Config:
        env_file = ".env"
        case_sensitive = True


# Single global instance — import this everywhere
settings = Settings()
