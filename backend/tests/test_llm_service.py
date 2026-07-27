"""Unit tests for the LLM abstraction layer (no network calls)."""

from __future__ import annotations

import pytest

from app.services import llm_service


class TestExtractJson:
    def test_bare_object(self):
        assert llm_service._extract_json('{"a": 1, "b": 2}') == {"a": 1, "b": 2}

    def test_bare_array(self):
        assert llm_service._extract_json('[1, 2, 3]') == [1, 2, 3]

    def test_fenced_block(self):
        text = 'Here you go:\n```json\n{"x": true}\n```\nThanks!'
        assert llm_service._extract_json(text) == {"x": True}

    def test_prose_wrapped_object(self):
        text = 'The result is {"ok": "yes"} — hope that helps.'
        assert llm_service._extract_json(text) == {"ok": "yes"}

    def test_invalid_returns_none(self):
        assert llm_service._extract_json("not json at all") is None

    def test_empty_returns_none(self):
        assert llm_service._extract_json("") is None


class TestAvailability:
    def test_unavailable_when_disabled(self, monkeypatch):
        from app.core.config import settings

        monkeypatch.setattr(settings, "LLM_ENABLED", False, raising=False)
        monkeypatch.setattr(settings, "OPENAI_API_KEY", "sk-something", raising=False)
        assert llm_service.llm_available() is False

    def test_unavailable_when_no_key(self, monkeypatch):
        from app.core.config import settings

        monkeypatch.setattr(settings, "LLM_ENABLED", True, raising=False)
        monkeypatch.setattr(settings, "OPENAI_API_KEY", None, raising=False)
        assert llm_service.llm_available() is False

    def test_available_when_enabled_and_key(self, monkeypatch):
        from app.core.config import settings

        monkeypatch.setattr(settings, "LLM_ENABLED", True, raising=False)
        monkeypatch.setattr(settings, "OPENAI_API_KEY", "sk-something", raising=False)
        assert llm_service.llm_available() is True


@pytest.mark.asyncio
class TestCallGracefulDegradation:
    async def test_call_llm_returns_none_when_unavailable(self, monkeypatch):
        from app.core.config import settings

        monkeypatch.setattr(settings, "LLM_ENABLED", False, raising=False)
        result = await llm_service.call_llm("sys", "user")
        assert result is None

    async def test_call_llm_json_returns_none_when_unavailable(self, monkeypatch):
        from app.core.config import settings

        monkeypatch.setattr(settings, "LLM_ENABLED", False, raising=False)
        result = await llm_service.call_llm_json("sys", "user")
        assert result is None

    async def test_call_llm_json_parses_monkeypatched_text(self, monkeypatch):
        async def fake_call_llm(*args, **kwargs):
            return '```json\n{"tasks": [{"title": "T"}]}\n```'

        monkeypatch.setattr(llm_service, "call_llm", fake_call_llm)
        result = await llm_service.call_llm_json("sys", "user")
        assert result == {"tasks": [{"title": "T"}]}
