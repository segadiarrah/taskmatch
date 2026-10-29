"""LLM provider registry + key store.

Lets an admin plug in the major market LLMs (with versions) so that
provider-backed "platform agents" can compete alongside the AI agents that
developers register — and so incoming requests can be executed immediately
without waiting for the first developers to sign up.

Keys are persisted to a JSON file under a writable data dir (the backend
bind-mounts ./backend, so this survives restarts). Keys are never returned in
full over the API — only a masked hint.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

import structlog

from app.services.model_catalog import CATALOG, RATES_AS_OF, SOURCES

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

_DATA_DIR = os.environ.get("PROVIDER_DATA_DIR", "/app/data")
_STORE_PATH = os.path.join(_DATA_DIR, "providers.json")


def _load() -> dict[str, dict[str, Any]]:
    try:
        with open(_STORE_PATH, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save(state: dict[str, dict[str, Any]]) -> None:
    os.makedirs(_DATA_DIR, exist_ok=True)
    tmp = _STORE_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(state, fh, indent=2)
    os.replace(tmp, _STORE_PATH)


def _mask(key: str | None) -> str | None:
    if not key:
        return None
    if len(key) <= 8:
        return "•" * len(key)
    return f"{key[:4]}…{key[-4:]}"


def list_providers() -> list[dict[str, Any]]:
    """Public (admin) view: catalog merged with saved config, keys masked."""
    state = _load()
    out = []
    for provider, meta in CATALOG.items():
        cfg = state.get(provider, {})
        out.append(
            {
                "provider": provider,
                "label": meta["label"],
                "base_url": cfg.get("base_url") or meta["base_url"],
                "models": cfg.get("available_models", meta["models"]),
                "selected_model": cfg.get("selected_model") or meta["models"][0],
                "enabled": bool(cfg.get("enabled")),
                "key_set": bool(cfg.get("api_key")),
                "key_hint": _mask(cfg.get("api_key")),
                **_catalog_status(provider, cfg),
            }
        )
    return out


def get_provider(provider: str) -> dict[str, Any] | None:
    if provider not in CATALOG:
        return None
    state = _load()
    cfg = state.get(provider, {})
    meta = CATALOG[provider]
    return {
        "provider": provider,
        "label": meta["label"],
        "base_url": cfg.get("base_url") or meta["base_url"],
        "api_key": cfg.get("api_key"),  # internal use only
        "models": cfg.get("available_models", meta["models"]),
        "selected_model": cfg.get("selected_model") or meta["models"][0],
        "enabled": bool(cfg.get("enabled")),
        **_catalog_status(provider, cfg),
    }


def _provider_identity(provider: str, cfg: dict) -> tuple[str | None, str]:
    """Scope account catalog evidence to the credential and endpoint checked."""
    return (cfg.get("api_key"), (cfg.get("base_url") or CATALOG[provider]["base_url"]).rstrip("/"))


def update_provider(
    provider: str,
    *,
    api_key: str | None = None,
    enabled: bool | None = None,
    selected_model: str | None = None,
    base_url: str | None = None,
) -> dict[str, Any] | None:
    if provider not in CATALOG:
        return None
    state = _load()
    cfg = state.get(provider, {})
    previous_identity = _provider_identity(provider, cfg)
    if selected_model is not None and selected_model not in cfg.get("available_models", CATALOG[provider]["models"]):
        raise ValueError(f"Unavailable or unpriced model: {selected_model}")
    if api_key is not None:
        cfg["api_key"] = api_key.strip()
    if enabled is not None:
        cfg["enabled"] = bool(enabled)
    if selected_model is not None:
        cfg["selected_model"] = selected_model
    if base_url is not None:
        cfg["base_url"] = base_url.strip()
    if previous_identity[0] and previous_identity != _provider_identity(provider, cfg):
        # The previous account's access is not evidence for its replacement.
        # Preserve the administrator's model choice and enabled switch, but
        # require an explicit check before this identity receives new quotes.
        cfg.update(available_models=[], refresh_status="unverified", last_refreshed_at=None,
                   last_refresh_attempt_at=None, refresh_error=None)
    state[provider] = cfg
    _save(state)
    logger.info("providers.updated", provider=provider, enabled=cfg.get("enabled"), key_set=bool(cfg.get("api_key")))
    return get_provider(provider)


def enabled_providers() -> list[str]:
    """Providers that are toggled on AND have a key — eligible to compete."""
    state = _load()
    return [p for p, cfg in state.items() if p in CATALOG and cfg.get("enabled") and cfg.get("api_key")]


def _catalog_status(provider: str, cfg: dict) -> dict:
    models = cfg.get("available_models", CATALOG[provider]["models"])
    selected = cfg.get("selected_model") or CATALOG[provider]["models"][0]
    return {
        "available_models": models,
        "selected_model_available": selected in models,
        "catalog_verified_at": RATES_AS_OF,
        "catalog_source": SOURCES[provider],
        "refresh_status": cfg.get("refresh_status", "catalog"),
        "last_refreshed_at": cfg.get("last_refreshed_at"),
        "last_refresh_attempt_at": cfg.get("last_refresh_attempt_at"),
        "refresh_error": cfg.get("refresh_error"),
        "catalog_checked_at": cfg.get("last_refreshed_at"),
        "catalog_error": cfg.get("refresh_error"),
    }


async def _fetch_models(provider: str, cfg: dict) -> list[str]:
    import httpx
    if not cfg.get("api_key"):
        raise ValueError("Provider key is required")
    headers = {"Authorization": f"Bearer {cfg['api_key']}"}
    url = cfg["base_url"].rstrip("/") + "/models"
    params = {}
    if provider == "anthropic":
        headers = {"x-api-key": cfg["api_key"], "anthropic-version": "2023-06-01"}
    elif provider == "google":
        url = "https://generativelanguage.googleapis.com/v1beta/models"
        headers = {"x-goog-api-key": cfg["api_key"]}
        params = {"pageSize": 1000}
    found = []
    async with httpx.AsyncClient(timeout=20) as client:
        for _ in range(20):
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            body = response.json()
            key = "models" if provider == "google" else "data"
            if not isinstance(body, dict) or not isinstance(body.get(key), list):
                raise ValueError("Invalid model catalog response")
            entries = body[key]
            for item in entries:
                model_id = (item.get("id") or item.get("name")) if isinstance(item, dict) else None
                if not isinstance(model_id, str) or not model_id.strip():
                    raise ValueError("Invalid model catalog entry")
                model = model_id.removeprefix("models/")
                if model in CATALOG[provider]["models"]:
                    found.append(model)
            token = body.get("nextPageToken")
            if token is not None and not isinstance(token, str):
                raise ValueError("Invalid model catalog cursor")
            if "has_more" in body and not isinstance(body["has_more"], bool):
                raise ValueError("Invalid model catalog pagination")
            if token:
                params["pageToken"] = token
            elif body.get("has_more"):
                cursor = body.get("last_id")
                if not isinstance(cursor, str) or not cursor:
                    raise ValueError("Missing model catalog cursor")
                params["after_id"] = cursor
            else:
                return list(dict.fromkeys(found))
    raise ValueError("Model pagination exceeded limit")


async def refresh_provider_models(provider: str) -> dict | None:
    cfg = get_provider(provider)
    if cfg is None:
        return None
    attempted = datetime.now(timezone.utc).isoformat()
    identity = _provider_identity(provider, cfg)
    try:
        models = await _fetch_models(provider, cfg)
        changes = dict(available_models=models, refresh_status="success",
                       last_refreshed_at=attempted, refresh_error=None)
    except Exception:
        changes = dict(refresh_status="error", refresh_error="Model refresh failed; last known catalog retained.")
    state = _load()
    saved = state.setdefault(provider, {})
    # An in-flight response from an old credential, endpoint or older check
    # must not re-validate a changed account or replace newer access evidence.
    if (_provider_identity(provider, saved) != identity
            or (saved.get("last_refresh_attempt_at") or "") > attempted):
        return next(p for p in list_providers() if p["provider"] == provider)
    saved.update(changes)
    saved["last_refresh_attempt_at"] = attempted
    _save(state)
    return next(p for p in list_providers() if p["provider"] == provider)
