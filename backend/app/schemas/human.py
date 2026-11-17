"""Provider-neutral contracts. Money is always an integer number of EUR cents."""
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, StrictInt, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class Budget(StrictModel):
    amount_minor: Annotated[StrictInt, Field(ge=110, le=100_000_000)]
    currency: Literal['EUR'] = 'EUR'


class Location(StrictModel):
    country: str = Field(pattern=r'^[A-Z]{2}$')
    city: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=500)


class HumanTaskContract(StrictModel):
    schema_version: Literal['tm.human-task.v1']
    task_id: UUID | None = None
    parent_job_id: UUID | None = None
    parent_task_id: UUID | None = None
    requester_type: Literal['HUMAN_REQUESTER', 'ORGANIZATION_REQUESTER', 'AGENT_REQUESTER']
    principal_id: UUID
    requesting_agent_id: UUID | None = None
    delegation_id: UUID | None = None
    title: str = Field(min_length=3, max_length=512)
    objective: str = Field(min_length=5, max_length=4000)
    instructions: str = Field(min_length=5, max_length=16000)
    task_category: str = Field(min_length=1, max_length=128)
    execution_mode: Literal['remote', 'physical', 'hybrid']
    required_capabilities: list[str] = Field(min_length=1, max_length=30)
    language: str = Field(pattern=r'^[a-z]{2,3}(-[A-Za-z]{2,8})?$')
    location: Location | None = None
    service_area: str | None = Field(default=None, max_length=500)
    deadline: datetime
    expected_duration: int = Field(ge=5, le=43200, description='Minutes')
    budget: Budget
    evidence_requirements: list[str] = Field(min_length=1, max_length=20)
    authorizations: list[str] = Field(min_length=1, max_length=20)
    taxonomy_version: Literal['tm.taxonomy.v1'] = 'tm.taxonomy.v1'

    @field_validator('required_capabilities', 'evidence_requirements', 'authorizations')
    @classmethod
    def nonempty_items(cls, values):
        if any(not v.strip() or len(v) > 256 for v in values):
            raise ValueError('List items must contain 1 to 256 characters')
        return sorted(set(v.strip() for v in values))

    @field_validator('deadline')
    @classmethod
    def timezone_required(cls, value):
        if value.tzinfo is None:
            raise ValueError('An explicit timezone is required')
        return value

    @model_validator(mode='after')
    def agent_binding(self):
        agent = self.requester_type == 'AGENT_REQUESTER'
        if agent != bool(self.requesting_agent_id and self.delegation_id):
            raise ValueError('Agent requesters require both agent and delegation')
        if not agent and (self.requesting_agent_id or self.delegation_id):
            raise ValueError('Only agent requesters may set agent/delegation')
        if self.execution_mode in ('physical', 'hybrid') and self.location is None:
            raise ValueError('Physical intervention requires a location')
        return self


class PrincipalCreate(StrictModel):
    kind: Literal['individual', 'organization']
    display_name: str = Field(min_length=2, max_length=256)


class DelegationCreate(StrictModel):
    agent_id: UUID
    max_amount_minor: Annotated[StrictInt, Field(ge=110, le=100_000_000)]
    categories: list[str] = Field(min_length=1, max_length=50)
    expires_at: datetime

    @field_validator('expires_at')
    @classmethod
    def expiry(cls, value):
        if value.tzinfo is None or not datetime.now(timezone.utc) < value <= datetime.now(timezone.utc) + timedelta(days=90):
            raise ValueError('Expiration must be timezone-aware and within 90 days')
        return value


class WorkerUpdate(StrictModel):
    country: str = Field(pattern=r'^[A-Z]{2}$')
    languages: list[str] = Field(min_length=1, max_length=15)
    timezone: str = Field(min_length=1, max_length=64)
    service_area: str = Field(default='', max_length=500)
    skills: list[str] = Field(min_length=1, max_length=30)
    available: bool = True
    desired_rate_minor: Annotated[StrictInt, Field(ge=0, le=1_000_000)] = 0
    mission_preferences: list[str] = Field(default_factory=list, max_length=50)
    data_consent: bool

    @field_validator('timezone')
    @classmethod
    def valid_timezone(cls, value):
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError:
            raise ValueError('Unknown IANA timezone') from None
        return value

    @field_validator('skills', 'languages', 'mission_preferences')
    @classmethod
    def list_items(cls, values):
        if any(not v.strip() or len(v) > 128 for v in values):
            raise ValueError('Invalid list item')
        return sorted(set(v.strip() for v in values))


class PublicationReview(StrictModel):
    authorizations_verified: Literal[True]
    qualifications_verified: Literal[True]
    notes: str = Field(min_length=5, max_length=2000)


class WorkerVerification(StrictModel):
    verification_status: Literal['verified', 'rejected', 'pending']
    attested_skills: list[str] = Field(default_factory=list, max_length=30)
    notes: str = Field(min_length=5, max_length=2000)


class HumanResult(StrictModel):
    summary: str = Field(min_length=5, max_length=4000)
    evidence: dict[str, str] = Field(min_length=1, max_length=20)

    @field_validator('evidence')
    @classmethod
    def evidence_present(cls, value):
        if any(not v.strip() or len(v) > 16000 for v in value.values()):
            raise ValueError('Evidence must be nonempty and bounded')
        return value
