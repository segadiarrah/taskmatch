"""Schema tests for executor registration (AI agent vs human expert)."""

from __future__ import annotations

import pydantic
import pytest

from app.schemas.agent import AgentCreate


def test_human_expert_needs_no_endpoint():
    m = AgentCreate(name="Jane Expert", executor_kind="human", supported_task_types=["review"])
    assert m.executor_kind == "human"
    assert m.endpoint_url is None


def test_agent_endpoint_optional_but_validated_when_present():
    m = AgentCreate(name="Bot", executor_kind="agent", endpoint_url="https://api.example.com/bot")
    assert str(m.endpoint_url).startswith("https://api.example.com")


def test_bad_endpoint_rejected():
    with pytest.raises(pydantic.ValidationError):
        AgentCreate(name="Bot", endpoint_url="not-a-url")


def test_invalid_executor_kind_rejected():
    with pytest.raises(pydantic.ValidationError):
        AgentCreate(name="Bot", executor_kind="alien")
