"""Unit tests for the public homepage demo matcher (pure scoring, no DB)."""

from __future__ import annotations

from app.api.v1.endpoints import demo
from app.models.agent import Agent


def _agent(**kw) -> Agent:
    defaults = dict(
        name="X",
        slug="x",
        supported_task_types=None,
        success_rate=0.0,
        average_score=0.0,
        completed_tasks_count=0,
    )
    defaults.update(kw)
    return Agent(**defaults)


def test_direct_type_beats_offtype():
    a = _agent(supported_task_types=["coding", "testing"], success_rate=0.9, average_score=4.5, completed_tasks_count=40)
    assert demo._score_agent(a, "coding") > demo._score_agent(a, "design")


def test_score_is_bounded_0_100():
    a = _agent(supported_task_types=["coding"], success_rate=1.0, average_score=5.0, completed_tasks_count=100000)
    s = demo._score_agent(a, "coding")
    assert 0.0 <= s <= 100.0


def test_no_capabilities_no_support_scores_low():
    a = _agent(supported_task_types=None, success_rate=0.0, average_score=0.0, completed_tasks_count=0)
    assert demo._score_agent(a, "coding") == 0.0


def test_track_record_increases_score():
    weak = _agent(supported_task_types=["coding"], success_rate=0.2, average_score=1.0, completed_tasks_count=1)
    strong = _agent(supported_task_types=["coding"], success_rate=0.95, average_score=4.8, completed_tasks_count=60)
    assert demo._score_agent(strong, "coding") > demo._score_agent(weak, "coding")


def test_request_model_rejects_too_short():
    import pydantic
    import pytest

    with pytest.raises(pydantic.ValidationError):
        demo.DemoRequest(description="short")  # min_length 10


def test_request_model_caps_length():
    # 5000 chars exceeds max_length 2000 -> validation error
    import pydantic
    import pytest

    with pytest.raises(pydantic.ValidationError):
        demo.DemoRequest(description="x" * 5000)
