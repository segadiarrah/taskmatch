"""Shared pytest fixtures / configuration for the TaskMatch.ai test suite."""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def _no_real_llm(monkeypatch):
    """Ensure unit tests never make a real network LLM call by default.

    Individual tests that want to exercise the LLM path monkeypatch the
    relevant llm_service function explicitly.
    """
    from app.core.config import settings

    monkeypatch.setattr(settings, "LLM_ENABLED", False, raising=False)
    yield
