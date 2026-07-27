"""FastAPI application entry-point for TaskMatch.ai."""

from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.api.v1.router import router as api_v1_router

_is_prod = settings.ENV == "production"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: runs setup on startup and teardown on shutdown."""
    setup_logging()
    logger = get_logger("app.main")
    logger.info("TaskMatch.ai API started", version=app.version, env=settings.ENV)
    yield
    logger.info("TaskMatch.ai API shutting down")


app = FastAPI(
    title="TaskMatch.ai API",
    version="1.0.0",
    openapi_url=None if _is_prod else f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=None if _is_prod else f"{settings.API_V1_PREFIX}/docs",
    redoc_url=None if _is_prod else f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
if _is_prod:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["taskmatch.ai", "www.taskmatch.ai", "*.taskmatch.ai"],
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Minimal liveness probe used by Docker and load balancers."""
    return {"status": "healthy", "app": settings.APP_NAME}
