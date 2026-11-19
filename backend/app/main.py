"""FastAPI application entry-point for TaskMatch.ai."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.router import router as api_v1_router
from app.core.config import settings
from app.core.database import get_db
from app.core.logging import get_logger, setup_logging
from app.services.stripe_gateway import StripeGatewayError, StripeSignatureError

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
        allowed_hosts=settings.TRUSTED_HOSTS,
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Idempotency-Key",
                  "MCP-Protocol-Version", "Mcp-Method", "Mcp-Name", "A2A-Version"],
    expose_headers=["MCP-Protocol-Version"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)
from app.api.v1.endpoints.protocol_a2a import public_router as agent_discovery_router
app.include_router(agent_discovery_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Minimal liveness probe used by Docker and load balancers."""
    return {"status": "healthy", "app": settings.APP_NAME}


@app.get("/health/ready", tags=["health"])
async def readiness_check(db: AsyncSession = Depends(get_db, scope="function")) -> JSONResponse:
    """Check backing services without exposing connection details."""
    try:
        async with asyncio.timeout(3):
            await db.execute(text("SELECT 1"))
            async with Redis.from_url(
                settings.REDIS_URL, socket_connect_timeout=2, socket_timeout=2
            ) as redis:
                await redis.ping()
            if settings.ENV == "production" and settings.PAYMENT_MODE == "stripe":
                from app.models.billing import BillingWorkerHeartbeat

                stamp = await db.scalar(
                    select(BillingWorkerHeartbeat.updated_at).where(
                        BillingWorkerHeartbeat.id == "billing"
                    )
                )
                if not stamp or stamp < datetime.now(UTC) - timedelta(seconds=90):
                    raise RuntimeError("Billing worker is unavailable")
    except Exception:
        # The dependency commits successful responses. Reset a failed probe's
        # transaction first so it cannot turn this deliberate 503 into a 500.
        try:
            async with asyncio.timeout(1):
                await db.rollback()
        except Exception:
            pass
        return JSONResponse({"status": "unavailable", "app": settings.APP_NAME}, status_code=503)
    return JSONResponse({"status": "ready", "app": settings.APP_NAME})


@app.exception_handler(StripeGatewayError)
async def stripe_error_handler(request, exc):
    code = (
        400
        if isinstance(exc, StripeSignatureError)
        else (
            503
            if exc.status_code in (401, 403) or exc.retryable
            else (409 if exc.status_code == 409 else 502)
        )
    )
    return JSONResponse(status_code=code, content={"detail": public_error_detail(str(exc))})


def public_error_detail(value):
    import re
    if isinstance(value,str):return re.sub(r"stripe", "payment service", value, flags=re.IGNORECASE)
    if isinstance(value,list):return [public_error_detail(v) for v in value]
    if isinstance(value,dict):return {k:public_error_detail(v) for k,v in value.items()}
    return value

@app.exception_handler(HTTPException)
async def public_http_error(request, exc):
    return JSONResponse(status_code=exc.status_code,content={'detail':public_error_detail(exc.detail)},headers=exc.headers)
