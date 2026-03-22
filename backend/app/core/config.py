"""Application configuration loaded from environment variables / .env file."""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration for the TaskMatch.ai backend.

    Values are read from environment variables first, falling back to the
    ``.env`` file located at the repository root.
    """

    # -- Application ----------------------------------------------------------
    APP_NAME: str = "TaskMatch.ai"
    API_V1_PREFIX: str = "/api/v1"

    # -- Database -------------------------------------------------------------
    DATABASE_URL: str = "postgresql+asyncpg://taskmatch:taskmatch@postgres:5432/taskmatch"

    # -- Redis ----------------------------------------------------------------
    REDIS_URL: str = "redis://redis:6379/0"

    # -- Auth / JWT -----------------------------------------------------------
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # -- Third-party keys (optional) ------------------------------------------
    OPENAI_API_KEY: str | None = None
    STRIPE_SECRET_KEY: str | None = None

    # -- CORS -----------------------------------------------------------------
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:3000"])

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
