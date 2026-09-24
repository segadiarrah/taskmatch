"""Application configuration loaded from environment variables / .env file."""

from __future__ import annotations

import warnings
from typing import Literal

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
    TRUSTED_HOSTS: list[str] = Field(default=[
        "taskmatch.ai", "www.taskmatch.ai", "*.taskmatch.ai", "localhost", "127.0.0.1", "backend",
    ])

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
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_CONNECT_WEBHOOK_SECRET: str | None = None
    STRIPE_MODE: Literal["test", "live"] = "test"
    STRIPE_API_VERSION: str = "2024-06-20"
    PAYMENT_MODE: Literal["stripe", "legacy_manual"] = "stripe"
    BILLING_SITE_URL: str = "https://taskmatch.ai"
    BILLING_WORKER_POLL_SECONDS: float = 2.0
    BILLING_OPERATION_LEASE_SECONDS: int = 600

    # -- LLM (OpenAI-compatible: OpenAI, OpenRouter, DeepSeek, …) --------------
    # When OPENAI_API_KEY is set, the MCP orchestration layer uses the LLM for
    # generative steps. Planning has a deterministic fallback; task execution
    # requires a real provider response or an external worker submission.
    OPENAI_BASE_URL: str | None = None  # e.g. https://openrouter.ai/api/v1
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_TIMEOUT_SECONDS: int = 30
    LLM_ENABLED: bool = True

    # -- Credential vault -----------------------------------------------------
    # Key material for encrypting access grants (client credentials shared for an
    # installation-mode delivery). Falls back to SECRET_KEY when unset; either
    # way it must not be the default placeholder, or the vault refuses to store
    # anything rather than pretend the secrets are protected.
    VAULT_SECRET_KEY: str | None = None
    # How long an access grant stays valid by default, and how many times it may
    # be revealed before it must be re-issued.
    ACCESS_GRANT_TTL_HOURS: int = 168  # 7 days
    ACCESS_GRANT_MAX_REVEALS: int = 5

    # -- Pricing --------------------------------------------------------------
    # A quote is honoured for this long; beyond it, provider rates may have moved
    # and the job must be re-priced before execution.
    QUOTE_VALIDITY_DAYS: int = 14
    # Model used to price LLM-routed tasks when no provider is enabled. Only
    # affects the *estimate* — the executing agent may use a different model.
    PRICING_DEFAULT_MODEL: str = "claude-sonnet-5"

    # -- Contact form email (SMTP, e.g. Brevo relay) --------------------------
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_STARTTLS: bool = True
    SMTP_FROM: str = "noreply@taskmatch.ai"
    CONTACT_TO: str = "sega@tauraco.ai"

    # -- CORS -----------------------------------------------------------------
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:3000"])

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }

    @model_validator(mode="after")
    def _validate_production(self) -> "Settings":
        if self.ENV == "production":
            if self.PAYMENT_MODE != "stripe":
                raise ValueError("New production jobs require Stripe payments")
            if not self.BILLING_SITE_URL.startswith("https://"):
                raise ValueError("BILLING_SITE_URL must use HTTPS in production")
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
