from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    # Operating Modes
    DB_MODE: str = "mock"  # "mock" | "postgres"
    AI_MODE: str = "stub"  # "stub" | "model"
    AI_MODEL_PATH: str = ""

    # Application
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    APP_SECRET_KEY: str = "change_this_to_a_secure_random_hex_string_32_bytes"
    SESSION_COOKIE_NAME: str = "ewaste_session"
    SESSION_MAX_AGE_SECONDS: int = 604800  # 7 days
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # PostgreSQL + PostGIS (Used when DB_MODE=postgres)
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "ewaste_db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ewaste_db"
    POSTGRES_POOL_MIN_SIZE: int = 2
    POSTGRES_POOL_MAX_SIZE: int = 10

    # Uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 10485760  # 10 MB

    # AI Configuration
    AI_MODEL_NAME: str = "mobilenet_v3_small"
    AI_CONFIDENCE_THRESHOLD: float = 0.60
    AI_DEVICE: str = "cpu"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
