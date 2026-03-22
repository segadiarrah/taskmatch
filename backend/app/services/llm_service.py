"""LLM abstraction layer.

This module is the **single place** where LLM calls happen in the
TaskMatch.ai backend.  It wraps an OpenAI-compatible client and falls back
to a deterministic placeholder response when no API key is configured,
making the rest of the codebase fully testable without an external LLM.
"""

from __future__ import annotations

import asyncio
from typing import Optional

import structlog

from app.core.config import settings

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_DEFAULT_MODEL = "gpt-4"
_DEFAULT_TIMEOUT_SECONDS = 30
_PLACEHOLDER_MARKER = "[MCP-MVP-PLACEHOLDER]"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def call_llm(
    system_prompt: str,
    user_prompt: str,
    model: str = _DEFAULT_MODEL,
    *,
    temperature: float = 0.3,
    max_tokens: int = 2048,
    timeout_seconds: int = _DEFAULT_TIMEOUT_SECONDS,
) -> str:
    """Send a prompt to an OpenAI-compatible LLM and return the response text.

    Parameters
    ----------
    system_prompt:
        The system-level instruction for the LLM.
    user_prompt:
        The user-level prompt containing the actual request / data.
    model:
        Model identifier (e.g. ``"gpt-4"``, ``"gpt-3.5-turbo"``).
    temperature:
        Sampling temperature.  Lower values produce more deterministic output.
    max_tokens:
        Maximum number of tokens in the completion.
    timeout_seconds:
        Hard timeout for the HTTP round-trip.

    Returns
    -------
    str
        The assistant response text.

    Notes
    -----
    When ``settings.OPENAI_API_KEY`` is ``None`` or empty, the function
    returns a placeholder string so that the rest of the pipeline can
    operate without an external LLM during development / testing.
    """

    api_key: Optional[str] = settings.OPENAI_API_KEY

    if not api_key:
        logger.warning(
            "llm.no_api_key",
            msg="OPENAI_API_KEY not configured; returning placeholder response",
            model=model,
        )
        return (
            f"{_PLACEHOLDER_MARKER} LLM call skipped (no API key). "
            f"model={model} system_prompt_len={len(system_prompt)} "
            f"user_prompt_len={len(user_prompt)}"
        )

    try:
        # Import openai lazily so the module loads even if the package is
        # not installed (graceful degradation for MVP).
        import openai  # noqa: WPS433

        client = openai.AsyncOpenAI(
            api_key=api_key,
            timeout=float(timeout_seconds),
        )

        logger.info(
            "llm.call_start",
            model=model,
            system_prompt_len=len(system_prompt),
            user_prompt_len=len(user_prompt),
        )

        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            ),
            timeout=timeout_seconds + 5,  # outer safety net
        )

        result_text: str = response.choices[0].message.content or ""

        logger.info(
            "llm.call_success",
            model=model,
            response_len=len(result_text),
            prompt_tokens=getattr(response.usage, "prompt_tokens", None),
            completion_tokens=getattr(response.usage, "completion_tokens", None),
        )

        return result_text

    except ImportError:
        logger.error(
            "llm.openai_not_installed",
            msg="openai package is not installed; returning placeholder",
        )
        return (
            f"{_PLACEHOLDER_MARKER} openai package not installed. "
            f"model={model}"
        )

    except asyncio.TimeoutError:
        logger.error(
            "llm.timeout",
            model=model,
            timeout_seconds=timeout_seconds,
        )
        raise

    except Exception:
        logger.exception("llm.call_failed", model=model)
        raise
