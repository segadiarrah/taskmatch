"""Protocol-neutral dispatch: every operation reuses the existing caller and domain."""
import json
import uuid
from typing import Annotated

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.human import HumanTaskContract


class CreateArguments(BaseModel):
    model_config = ConfigDict(extra='forbid')
    contract: HumanTaskContract
    idempotency_key: Annotated[str, Field(min_length=1, max_length=128)]


class ReadArguments(BaseModel):
    model_config = ConfigDict(extra='forbid')
    task_id: uuid.UUID


class EventArguments(ReadArguments):
    skip: Annotated[int, Field(ge=0)] = 0
    limit: Annotated[int, Field(ge=1, le=100)] = 30


OPERATIONS = {
    'human_task_create': (CreateArguments, 'Create a human task within the authenticated principal and mandate.'),
    'human_task_get': (ReadArguments, 'Read an accessible human task and its current status.'),
    'human_task_result': (ReadArguments, 'Read the approved result when it is ready.'),
    'human_task_events': (EventArguments, 'Poll redacted audit events for an accessible task.'),
    'human_task_fund': (ReadArguments, 'Request funding using the principal payment authorization and existing mandate reservation.'),
}


def tools():
    return [{'name': name, 'description': description, 'inputSchema': schema.model_json_schema(),
             'annotations': {'readOnlyHint': name in ('human_task_get', 'human_task_result', 'human_task_events'),
                             'idempotentHint': True, 'openWorldHint': False}}
            for name, (schema, description) in OPERATIONS.items()]


def public_error(exc):
    detail = exc.detail if isinstance(exc.detail, str) else 'Operation could not be completed'
    if any(name in detail.lower() for name in ('stripe', 'payment_intent', 'sk_live_', 'sk_test_')):
        return 'Payment operation could not be completed'
    return detail


async def execute(db, identity, operation, arguments):
    """A failed RPC must roll back partial reservations just like a failed REST request."""
    from app.api.v1.endpoints import human_tasks
    model = OPERATIONS[operation][0].model_validate(arguments)
    async with db.begin_nested():
        if operation == 'human_task_create':
            result = await human_tasks.create(model.contract, identity, db, model.idempotency_key)
        elif operation == 'human_task_get':
            result = await human_tasks.get_contract(model.task_id, identity, db)
        elif operation == 'human_task_result':
            result = await human_tasks.result(model.task_id, identity, db)
        elif operation == 'human_task_events':
            result = await human_tasks.events(model.task_id, identity, db, model.skip, model.limit)
        else:
            from app.services.autonomous_funding import request_funding
            user, delegation = identity
            result = await request_funding(db, model.task_id, user, delegation)
    return jsonable_encoder(result)


def tool_content(value, *, error=False):
    return {'content': [{'type': 'text', 'text': json.dumps(value, ensure_ascii=False, separators=(',', ':'))}],
            'structuredContent': value, 'isError': error}


async def a2a_task(db, identity, task_id):
    from app.api.v1.endpoints import human_tasks
    task = await human_tasks.accessible(db, uuid.UUID(str(task_id)), identity)
    result = await human_tasks.result(task.id, identity, db)
    status = str(task.status)
    states = {'pending': 'submitted', 'open_for_bids': 'submitted', 'assigned': 'working',
              'in_progress': 'working', 'submitted': 'working', 'validation_failed': 'working',
              'approved': 'completed', 'cancelled': 'canceled', 'reassigned': 'working'}
    value = {'kind': 'task', 'id': str(task.id), 'contextId': str(task.job_id),
             'status': {'state': states.get(status, 'unknown'), 'timestamp': task.updated_at.isoformat()},
             'metadata': {'taskmatch': {'schema_version': 'tm.human-task.v1',
                 'status': status, 'policy_status': task.human_policy_status}}}
    if result['ready']:
        value['artifacts'] = [{'artifactId': str(task.id)+':approved-result', 'name': 'Approved result',
                              'parts': [{'kind': 'data', 'data': result['result']}]}]
    return value
