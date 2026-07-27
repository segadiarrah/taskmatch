"""Application configuration loaded from environment variables / .env file."""

from __future__ import annotations

import warnings

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration for the TaskMatch.ai backend.

    Values are read from environment variables first, falling back to the
    ``.env`` file located at the repository root.
    """

    # -- Application ----------------------------------------------------------
    APP_NAME: str = "TaskMatch.ai"
    API_V1_PREFIX: str = "/api/v1"
    ENV: str = Field(default="development")  # development | staging | production

    # -- Database -------------------------------------------------------------
    DATABASE_URL: str = "postgresql+asyncpg://taskmatch:taskmatch@postgres:5432/taskmatch"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 3600

    # -- Redis ----------------------------------------------------------------
    REDIS_URL: str = "redis://redis:6379/0"

    # -- Auth / JWT -----------------------------------------------------------
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # -- Third-party keys (optional) ------------------------------------------
    OPENAI_API_KEY: str | None = None
    STRIPE_SECRET_KEY: str | None = None

    # -- LLM (OpenAI-compatible: OpenAI, OpenRouter, DeepSeek, …) --------------
    # When OPENAI_API_KEY is set, the MCP orchestration layer uses the LLM for
    # the generative steps (job formatting & decomposition). Every LLM call has
    # a deterministic fallback, so the platform works fully even without a key.
    OPENAI_BASE_URL: str | None = None  # e.g. https://openrouter.ai/api/v1
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_TIMEOUT_SECONDS: int = 30
    LLM_ENABLED: bool = True

    # -- CORS -----------------------------------------------------------------
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:3000"])

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }

    @model_validator(mode="after")
    def _validate_production(self) -> "Settings":
        if self.ENV == "production":
            if self.SECRET_KEY == "change-me-in-production" or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "SECRET_KEY must be at least 32 characters and not the default value in production"
                )
            if any(o.startswith("http://localhost") for o in self.CORS_ORIGINS):
                warnings.warn(
                    "CORS_ORIGINS contains localhost in production — this is likely a misconfiguration",
                    stacklevel=2,
                )
        return self


settings = Settings()
