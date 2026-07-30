"""Schema tests for executor registration (AI agent vs human expert)."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import pydantic
import pytest

from app.schemas.agent import AgentCreate, AgentResponse


def _agent_response(endpoint_url: str) -> AgentResponse:
    now = datetime.now(timezone.utc)
    return AgentResponse(
        id=uuid4(),
        developer_user_id=uuid4(),
        name="X",
        slug="x",
        description="",
        endpoint_url=endpoint_url,
        auth_type="none",
        status="active",
        created_at=now,
        updated_at=now,
    )


def test_response_kind_human_from_experts_url():
    assert _agent_response("https://taskmatch.ai/experts/jane").kind == "human"


def test_response_kind_agent_for_real_endpoint():
    assert _agent_response("https://api.example.com/bot").kind == "agent"
    assert _agent_response("https://taskmatch.ai/agents/bot").kind == "agent"


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
