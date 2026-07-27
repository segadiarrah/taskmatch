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
from typing import Any

import structlog

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

_DATA_DIR = os.environ.get("PROVIDER_DATA_DIR", "/app/data")
_STORE_PATH = os.path.join(_DATA_DIR, "providers.json")

# The market catalog: provider -> label, OpenAI-compatible base_url, and the
# model versions offered. Extend freely; this is what the admin page renders.
CATALOG: dict[str, dict[str, Any]] = {
    "openai": {
        "label": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "models": ["gpt-4o", "gpt-4.1", "gpt-4o-mini", "o3"],
    },
    "anthropic": {
        "label": "Anthropic",
        "base_url": "https://api.anthropic.com/v1",
        "models": ["claude-opus-4.8", "claude-sonnet-4.5", "claude-haiku-4.5"],
    },
    "google": {
        "label": "Google",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "models": ["gemini-2.5-pro", "gemini-2.5-flash"],
    },
    "mistral": {
        "label": "Mistral",
        "base_url": "https://api.mistral.ai/v1",
        "models": ["mistral-large-latest", "mistral-small-latest"],
    },
    "deepseek": {
        "label": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "models": ["deepseek-chat", "deepseek-reasoner"],
    },
    "xai": {
        "label": "xAI (Grok)",
        "base_url": "https://api.x.ai/v1",
        "models": ["grok-4", "grok-3"],
    },
    "openrouter": {
        "label": "OpenRouter",
        "base_url": "https://openrouter.ai/api/v1",
        "models": ["deepseek/deepseek-chat-v3-0324", "openai/gpt-4o", "anthropic/claude-sonnet-4.5"],
    },
}


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
                "models": meta["models"],
                "selected_model": cfg.get("selected_model") or meta["models"][0],
                "enabled": bool(cfg.get("enabled")),
                "key_set": bool(cfg.get("api_key")),
                "key_hint": _mask(cfg.get("api_key")),
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
        "models": meta["models"],
        "selected_model": cfg.get("selected_model") or meta["models"][0],
        "enabled": bool(cfg.get("enabled")),
    }


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
    if api_key is not None:
        cfg["api_key"] = api_key.strip()
    if enabled is not None:
        cfg["enabled"] = bool(enabled)
    if selected_model is not None and selected_model in CATALOG[provider]["models"]:
        cfg["selected_model"] = selected_model
    if base_url is not None:
        cfg["base_url"] = base_url.strip()
    state[provider] = cfg
    _save(state)
    logger.info("providers.updated", provider=provider, enabled=cfg.get("enabled"), key_set=bool(cfg.get("api_key")))
    return get_provider(provider)


def enabled_providers() -> list[str]:
    """Providers that are toggled on AND have a key — eligible to compete."""
    state = _load()
    return [p for p, cfg in state.items() if cfg.get("enabled") and cfg.get("api_key")]
