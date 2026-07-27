"""Unit tests for the MCP orchestration service (pure logic, no DB)."""

from __future__ import annotations

from decimal import Decimal

import pytest

from app.models.job import Job
from app.services import mcp_service


class TestInferTaskType:
    @pytest.mark.parametrize(
        "text,expected",
        [
            ("Build a REST API in Python", "coding"),
            ("Design a Figma wireframe for the UI", "design"),
            ("Analyse the quarterly sales figures and report statistics", "data_analysis"),
            ("Write a blog article about onboarding", "writing"),
            ("Add QA tests to verify the checkout", "testing"),
            ("Investigate competitor pricing", "research"),
            ("Create a project roadmap and delivery plan", "planning"),
            ("Something entirely unrelated", "general"),
        ],
    )
    def test_infer(self, text, expected):
        assert mcp_service._infer_task_type(text) == expected


class TestSplitOnConjunctions:
    def test_numbered_list(self):
        parts = mcp_service._split_on_conjunctions("1. Design UI 2. Build API 3. Ship it")
        assert len(parts) == 3

    def test_conjunctions(self):
        parts = mcp_service._split_on_conjunctions("Build the backend and design the frontend then deploy")
        assert len(parts) >= 3

    def test_single_clause(self):
        parts = mcp_service._split_on_conjunctions("Just one thing")
        assert parts == ["Just one thing"]


class TestExtractSentences:
    def test_caps_at_max(self):
        text = "One. Two. Three. Four. Five. Six. Seven."
        assert len(mcp_service._extract_sentences(text, max_count=3)) == 3

    def test_strips_blanks(self):
        assert mcp_service._extract_sentences("") == []


def _make_job(**kwargs) -> Job:
    """Construct a detached Job ORM instance (no session) for logic tests."""
    defaults = dict(
        title="Test job",
        raw_description="Build something useful.",
        budget_min=Decimal("1000"),
        budget_max=Decimal("5000"),
        currency="USD",
        deadline=None,
    )
    defaults.update(kwargs)
    return Job(**defaults)


@pytest.mark.asyncio
class TestLlmDecomposeCleaning:
    async def test_valid_tasks_cleaned_and_capped(self, monkeypatch):
        async def fake_json(*args, **kwargs):
            return {
                "tasks": [
                    {"title": f"Task {i}", "description": "do work", "task_type": "coding", "priority": i}
                    for i in range(1, 10)  # 9 tasks -> should cap at 6
                ]
            }

        monkeypatch.setattr(mcp_service.llm_service, "call_llm_json", fake_json)
        specs = await mcp_service._llm_decompose_job(_make_job(), {"objective": "x"})
        assert specs is not None
        assert len(specs) == 6  # capped
        assert all(s["task_type"] in mcp_service._TASK_TYPES for s in specs)

    async def test_invalid_task_type_is_reinferred(self, monkeypatch):
        async def fake_json(*args, **kwargs):
            return {"tasks": [{"title": "Write docs", "description": "write the documentation", "task_type": "bogus"}]}

        monkeypatch.setattr(mcp_service.llm_service, "call_llm_json", fake_json)
        specs = await mcp_service._llm_decompose_job(_make_job(), {})
        assert specs is not None
        assert specs[0]["task_type"] == "writing"  # re-inferred from text

    async def test_none_when_llm_unavailable(self, monkeypatch):
        async def fake_json(*args, **kwargs):
            return None

        monkeypatch.setattr(mcp_service.llm_service, "call_llm_json", fake_json)
        assert await mcp_service._llm_decompose_job(_make_job(), {}) is None

    async def test_empty_task_list_returns_none(self, monkeypatch):
        async def fake_json(*args, **kwargs):
            return {"tasks": []}

        monkeypatch.setattr(mcp_service.llm_service, "call_llm_json", fake_json)
        assert await mcp_service._llm_decompose_job(_make_job(), {}) is None


@pytest.mark.asyncio
class TestLlmFormatJob:
    async def test_valid_result_passthrough(self, monkeypatch):
        async def fake_json(*args, **kwargs):
            return {
                "objective": "Ship a dashboard",
                "deliverables": ["API", "UI"],
                "constraints": [],
                "success_criteria": ["works"],
            }

        monkeypatch.setattr(mcp_service.llm_service, "call_llm_json", fake_json)
        result = await mcp_service._llm_format_job(_make_job())
        assert result is not None
        assert result["objective"] == "Ship a dashboard"

    async def test_empty_result_returns_none(self, monkeypatch):
        async def fake_json(*args, **kwargs):
            return {"constraints": []}  # no objective / deliverables

        monkeypatch.setattr(mcp_service.llm_service, "call_llm_json", fake_json)
        assert await mcp_service._llm_format_job(_make_job()) is None
