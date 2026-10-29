"""LLM abstraction layer.

This module is the **single place** where LLM calls happen in the
TaskMatch.ai backend. It supports native Anthropic and OpenAI-compatible APIs
(OpenAI, OpenRouter, DeepSeek, …) and degrades gracefully to a deterministic path
when no API key is configured or the provider is unavailable. Planning may
use deterministic rules; execution must require a genuine generated result.

Design contract
---------------
* ``call_llm`` returns the raw assistant text, or ``None`` when the LLM is
  unavailable for any reason (no key, timeout, API error).
* ``call_llm_json`` returns a parsed ``dict``/``list``, or ``None`` on any
  failure. Callers must report unavailability or use an appropriate planning fallback.

Neither function raises for provider/availability problems; the MCP layer
handles ``None`` explicitly instead of treating it as a successful execution.
"""

from __future__ import annotations

import json
import re
from typing import Any, Optional

import structlog

from app.core.config import settings

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)


class ProviderExecutionError(RuntimeError):
    """Safe execution failure classification; never includes upstream bodies."""

    def __init__(self, message: str, *, retryable: bool):
        super().__init__(message)
        self.retryable = retryable


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
    from app.services.model_catalog import CATALOG, model_rate
    base_url = settings.OPENAI_BASE_URL or CATALOG["openai"]["base_url"]
    provider = next((p for p, meta in CATALOG.items()
                     if meta["base_url"].rstrip("/") == base_url.rstrip("/")), None)
    try:
        if provider is None:
            raise ValueError("Unrecognised planning provider URL")
        model_rate(provider, model)
        text, _ = await _provider_request(
            provider=provider, model=model, api_key=settings.OPENAI_API_KEY,
            base_url=base_url, system_prompt=system_prompt, user_prompt=user_prompt,
            max_output_tokens=max_tokens, timeout_seconds=timeout_seconds,
            response_format=response_format, temperature=temperature,
        )
        return text
    except Exception:
        logger.warning("llm.call_failed", provider=provider, model=model)
        return None


async def _provider_request(*, provider: str, model: str, api_key: str,
                            base_url: str, system_prompt: str, user_prompt: str,
                            max_output_tokens: int, timeout_seconds: int,
                            response_format: dict | None = None,
                            temperature: float = 0.2,
                            rates: dict | None = None) -> tuple[str, dict]:
    """One HTTP request with no implicit retries or unbounded generation."""
    import httpx
    headers = {"Authorization": f"Bearer {api_key}"}
    messages = [{"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}]
    if provider == "anthropic":
        endpoint = "/messages"
        headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
        payload = {"model": model, "system": system_prompt,
                   "messages": messages[1:], "max_tokens": max_output_tokens}
    elif provider == "xai" and model == "grok-4.7":
        endpoint = "/responses"
        payload = {"model": model, "input": messages,
                   "max_output_tokens": max_output_tokens, "reasoning": {"effort": "low"}}
    else:
        endpoint = "/chat/completions"
        payload = {"model": model, "messages": messages}
        bare_model = model.rsplit("/", 1)[-1]
        reasoning = bare_model.startswith(("gpt-5", "gpt-6", "o1", "o3", "o4"))
        payload["max_completion_tokens" if reasoning else "max_tokens"] = max_output_tokens
        if reasoning:
            payload["reasoning_effort"] = "low"
        elif provider not in {"anthropic", "deepseek", "google", "xai"} and not bare_model.startswith("claude-"):
            payload["temperature"] = temperature
        if response_format is not None:
            payload["response_format"] = response_format
        if provider == "openrouter":
            # Require the hard limit to be honoured; do not route to an adapter
            # that silently drops unsupported parameters.
            from app.services.model_catalog import model_rate
            rate_in, rate_out = model_rate(provider, model)
            if rates is not None:
                rate_in = rates["input_usd_per_million"]
                rate_out = rates["output_usd_per_million"]
            payload["provider"] = {
                "require_parameters": True, "allow_fallbacks": False,
                "max_price": {"prompt": rate_in, "completion": rate_out, "request": 0},
            }
    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(base_url.rstrip("/") + endpoint, headers=headers, json=payload)
        response.raise_for_status()
        body = response.json()
    usage = body.get("usage") or {}
    if provider == "anthropic":
        if body.get("stop_reason") not in {"end_turn", "stop_sequence"}:
            raise ValueError("Truncated provider response")
        text = "".join(c.get("text", "") for c in body.get("content", []) if c.get("type") == "text")
    elif endpoint == "/responses":
        if body.get("status") != "completed":
            raise ValueError("Incomplete provider response")
        text = "".join(c.get("text", "") for item in body.get("output", [])
                       for c in item.get("content", []) if c.get("type") == "output_text")
    else:
        choice = body["choices"][0]
        if choice.get("finish_reason") in {"length", "content_filter"}:
            raise ValueError("Incomplete provider response")
        text = choice["message"].get("content") or ""
    return text, {"input_tokens": usage.get("input_tokens", usage.get("prompt_tokens", 0)),
                  "output_tokens": usage.get("output_tokens", usage.get("completion_tokens", 0))}


async def execute_task_output(system_prompt: str, user_prompt: str, *, execution: dict) -> dict | None:
    """Execute a single paid attempt using only the accepted quote's route.

    The caller reserves per_attempt_cost_eur BEFORE calling and enforces the
    durable attempt counter. Network errors and invalid results consume that
    reservation: a failed response cannot prove that the provider charged zero.
    """
    import httpx
    from decimal import Decimal
    from app.services import providers
    from app.services.model_catalog import model_rate
    provider_called = False
    try:
        provider, model = execution["provider"], execution["model"]
        model_rate(provider, model)
        cfg = providers.get_provider(provider)
        if not cfg or not cfg.get("enabled") or not cfg.get("api_key"):
            raise ProviderExecutionError("Provider is disabled or has no configured key", retryable=False)
        base_url = execution["base_url"]
        if cfg["base_url"].rstrip("/") != base_url.rstrip("/"):
            raise ProviderExecutionError("Provider endpoint changed since quote", retryable=False)
        max_input = execution["max_input_tokens"]
        max_output = execution["max_output_tokens"]
        attempts = execution["max_attempts"]
        if (type(max_input) is not int or type(max_output) is not int or type(attempts) is not int
                or not 1 <= max_input <= 64000 or not 1 <= max_output <= 32000 or not 1 <= attempts <= 3):
            raise ProviderExecutionError("Invalid execution limits", retryable=False)
        system_prompt += "\nReturn a JSON object with result and summary."
        # UTF-8 bytes upper-bound normal text tokenization; include message overhead.
        if len(system_prompt.encode("utf-8")) + len(user_prompt.encode("utf-8")) + 256 > max_input:
            raise ProviderExecutionError("Prompt exceeds the quoted input limit", retryable=False)
        rates = execution["rates"]
        rate_in = Decimal(str(rates["input_usd_per_million"]))
        rate_out = Decimal(str(rates["output_usd_per_million"]))
        fx = Decimal(str(execution["fx_usd_to_eur"]))
        reserve = Decimal(str(execution["per_attempt_cost_eur"]))
        total = Decimal(str(execution["max_cost_eur"]))
        if not all(n.is_finite() and n > 0 for n in (rate_in, rate_out, fx, reserve, total)):
            raise ProviderExecutionError("Invalid execution rate or budget", retryable=False)
        maximum = (max_input * rate_in + max_output * rate_out) / Decimal(1_000_000) * fx
        if reserve < maximum or total < reserve * attempts:
            raise ProviderExecutionError("Execution budget does not cover its limits", retryable=False)
        provider_called = True
        text, usage = await _provider_request(
            provider=provider, model=model, api_key=cfg["api_key"], base_url=base_url,
            system_prompt=system_prompt, user_prompt=user_prompt,
            max_output_tokens=max_output, timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
            response_format={"type": "json_object"}, rates=rates,
        )
        parsed = _extract_json(text)
        if not isinstance(parsed, dict) or not parsed.get("result"):
            return None
        parsed["_usage"] = {**usage, "provider": provider, "model": model,
                            "reserved_cost_eur": float(reserve)}
        return parsed
    except ProviderExecutionError:
        raise
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        raise ProviderExecutionError(
            f"Provider request failed (HTTP {status})", retryable=status in (408, 429) or status >= 500
        ) from None
    except (httpx.TimeoutException, httpx.TransportError):
        raise ProviderExecutionError("Provider request timed out or could not connect", retryable=True) from None
    except Exception:
        raise ProviderExecutionError(
            "Provider returned an invalid response" if provider_called else "Invalid execution provider or snapshot",
            retryable=provider_called,
        ) from None


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
