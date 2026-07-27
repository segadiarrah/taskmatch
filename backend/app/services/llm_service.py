"""LLM abstraction layer.

This module is the **single place** where LLM calls happen in the
TaskMatch.ai backend.  It wraps an OpenAI-compatible client (OpenAI,
OpenRouter, DeepSeek, …) and degrades gracefully to a deterministic path
when no API key is configured or the provider is unavailable, making the
rest of the codebase fully functional and testable without an external LLM.

Design contract
---------------
* ``call_llm`` returns the raw assistant text, or ``None`` when the LLM is
  unavailable for any reason (no key, package missing, timeout, API error).
* ``call_llm_json`` returns a parsed ``dict``/``list``, or ``None`` on any
  failure — callers MUST provide a deterministic fallback.

Neither function raises for provider/availability problems; the MCP layer
treats ``None`` as "use the deterministic engine".
"""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any, Optional

import structlog

from app.core.config import settings

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)


def llm_available() -> bool:
    """Return True when an LLM call can plausibly be made."""
    return bool(settings.LLM_ENABLED and settings.OPENAI_API_KEY)


async def call_llm(
    system_prompt: str,
    user_prompt: str,
    *,
    model: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 2048,
    timeout_seconds: int | None = None,
    response_format: dict | None = None,
) -> Optional[str]:
    """Send a prompt to an OpenAI-compatible LLM and return the response text.

    Returns ``None`` (never raises) when the LLM is unavailable for any
    reason, so callers can fall back to deterministic logic.
    """
    if not llm_available():
        logger.info("llm.unavailable", reason="disabled_or_no_api_key")
        return None

    model = model or settings.LLM_MODEL
    timeout_seconds = timeout_seconds or settings.LLM_TIMEOUT_SECONDS

    try:
        # Import lazily so the module loads even if the package is absent.
        import openai  # noqa: WPS433

        client_kwargs: dict[str, Any] = {
            "api_key": settings.OPENAI_API_KEY,
            "timeout": float(timeout_seconds),
        }
        if settings.OPENAI_BASE_URL:
            client_kwargs["base_url"] = settings.OPENAI_BASE_URL

        client = openai.AsyncOpenAI(**client_kwargs)

        create_kwargs: dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format is not None:
            create_kwargs["response_format"] = response_format

        logger.info(
            "llm.call_start",
            model=model,
            system_prompt_len=len(system_prompt),
            user_prompt_len=len(user_prompt),
        )

        response = await asyncio.wait_for(
            client.chat.completions.create(**create_kwargs),
            timeout=timeout_seconds + 5,  # outer safety net
        )

        result_text: str = response.choices[0].message.content or ""
        logger.info(
            "llm.call_success",
            model=model,
            response_len=len(result_text),
            prompt_tokens=getattr(getattr(response, "usage", None), "prompt_tokens", None),
            completion_tokens=getattr(getattr(response, "usage", None), "completion_tokens", None),
        )
        return result_text

    except ImportError:
        logger.warning(
            "llm.openai_not_installed",
            msg="openai package not installed; using deterministic fallback",
        )
        return None
    except asyncio.TimeoutError:
        logger.warning("llm.timeout", model=model, timeout_seconds=timeout_seconds)
        return None
    except Exception as exc:  # noqa: BLE001 — degrade gracefully on any provider error
        logger.warning("llm.call_failed", model=model, error=str(exc))
        return None


def _extract_json(text: str) -> Optional[Any]:
    """Best-effort extraction of a JSON object/array from an LLM response.

    Handles bare JSON, ```json fenced blocks, and leading/trailing prose.
    """
    if not text:
        return None
    text = text.strip()

    # Strip markdown code fences if present.
    fence = re.search(r"```(?:json)?\s*(.+?)```", text, flags=re.DOTALL | re.IGNORECASE)
    if fence:
        text = fence.group(1).strip()

    # Direct parse first.
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fall back to the first balanced {...} or [...] span.
    for open_ch, close_ch in (("{", "}"), ("[", "]")):
        start = text.find(open_ch)
        end = text.rfind(close_ch)
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                continue
    return None


async def call_llm_json(
    system_prompt: str,
    user_prompt: str,
    *,
    model: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 2048,
) -> Optional[Any]:
    """Call the LLM and parse a JSON object/array from its response.

    Returns ``None`` on any failure (unavailable, bad JSON, etc.) so the
    caller can use its deterministic fallback.
    """
    # Ask for a JSON object; many OpenAI-compatible providers honour this.
    text = await call_llm(
        system_prompt=system_prompt + "\n\nRespond with valid JSON only. No prose, no markdown fences.",
        user_prompt=user_prompt,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )
    if text is None:
        # Retry once without response_format for providers that reject it.
        text = await call_llm(
            system_prompt=system_prompt + "\n\nRespond with valid JSON only.",
            user_prompt=user_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    if text is None:
        return None

    parsed = _extract_json(text)
    if parsed is None:
        logger.warning("llm.json_parse_failed", response_preview=text[:200])
    return parsed
