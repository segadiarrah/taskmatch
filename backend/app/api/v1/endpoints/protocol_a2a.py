"""A2A 0.3.0 JSON-RPC binding with structured Human Task messages and polling."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.protocol_mcp import read_rpc, rpc_error
from app.core.config import settings
from app.core.database import get_db
from app.services import protocol_adapters as adapter
from app.services.human_authorization import caller, enabled

router = APIRouter(dependencies=[Depends(enabled)])
public_router = APIRouter(dependencies=[Depends(enabled)])


@public_router.get('/.well-known/agent-card.json')
@router.get('/protocols/a2a/agent-card.json')
async def agent_card():
    # A configured canonical URL avoids trusting attacker-controlled Host headers.
    base = settings.BILLING_SITE_URL.rstrip('/')
    return {'protocolVersion': '0.3.0', 'name': 'TaskMatch Human Tasks', 'version': '1.0.0',
        'description': 'Create human tasks under a mandate, poll status and approved results, and request authorized funding.',
        'url': base+settings.API_V1_PREFIX+'/protocols/a2a', 'preferredTransport': 'JSONRPC',
        'capabilities': {'streaming': False, 'pushNotifications': False, 'stateTransitionHistory': False},
        'securitySchemes': {'bearer': {'type': 'http', 'scheme': 'bearer', 'bearerFormat': 'JWT'}},
        'security': [{'bearer': []}], 'defaultInputModes': ['application/json'],
        'defaultOutputModes': ['application/json'], 'skills': [{
            'id': 'human_tasks', 'name': 'Human Tasks',
            'description': 'A single data part containing contract creates a task. Data operations result, events and fund require task_id. messageId binds creation idempotency. Poll with tasks/get. Cancellation is unavailable.',
            'tags': ['human-tasks', 'delegation', 'polling'],
            'inputModes': ['application/json'], 'outputModes': ['application/json']}],
        'supportsAuthenticatedExtendedCard': False}


@router.post('/protocols/a2a')
async def a2a(request: Request, identity: Annotated[tuple, Depends(caller)], db: Annotated[AsyncSession, Depends(get_db)]):
    body, error = await read_rpc(request)
    if error is not None:
        return error
    request_id, method, params = body['id'], body['method'], body.get('params', {})
    version = request.headers.get('a2a-version')
    if version and version != '0.3.0':
        return rpc_error(request_id, -32600, 'Only A2A 0.3.0 is supported', 400)
    try:
        if method in ('tasks/get', 'tasks/cancel'):
            if set(params)-{'id', 'historyLength', 'metadata'} or not isinstance(params.get('id'), str):
                raise ValueError('Invalid task query')
            task = await adapter.a2a_task(db, identity, params['id'])
            if method == 'tasks/cancel':
                return rpc_error(request_id, -32002, 'Task cannot be canceled')
            result = task
        elif method == 'message/send':
            configuration = params.get('configuration', {})
            if not isinstance(configuration, dict):
                raise ValueError('Invalid configuration')
            if configuration.get('pushNotificationConfig') is not None:
                return rpc_error(request_id, -32003, 'Push notifications are not supported')
            modes = configuration.get('acceptedOutputModes')
            if modes and 'application/json' not in modes:
                return rpc_error(request_id, -32005, 'Only application/json output is supported')
            message = params.get('message')
            if (not isinstance(message, dict) or message.get('kind') != 'message'
                    or message.get('role') != 'user' or not isinstance(message.get('messageId'), str)
                    or not 1 <= len(message['messageId']) <= 120
                    or message.get('taskId') or message.get('contextId')):
                raise ValueError('A new structured user message with messageId is required')
            parts = message.get('parts')
            if (not isinstance(parts, list) or len(parts) != 1 or not isinstance(parts[0], dict)
                    or parts[0].get('kind') != 'data' or not isinstance(parts[0].get('data'), dict)):
                return rpc_error(request_id, -32005, 'Exactly one application/json data part is required')
            data = parts[0]['data']
            operation = data.get('operation', 'create')
            if operation == 'create':
                if set(data)-{'operation', 'contract'}:
                    raise ValueError('Invalid create data')
                value = await adapter.execute(db, identity, 'human_task_create', {
                    'contract': data.get('contract'), 'idempotency_key': 'a2a:'+message['messageId']})
                result = await adapter.a2a_task(db, identity, value['task_id'])
            elif operation in ('result', 'events', 'fund'):
                arguments = {k: v for k, v in data.items() if k != 'operation'}
                value = await adapter.execute(db, identity, 'human_task_'+operation, arguments)
                result = {'kind': 'message', 'role': 'agent', 'messageId': str(uuid.uuid4()),
                          'taskId': str(data['task_id']), 'parts': [{'kind': 'data', 'data': value}]}
            else:
                raise ValueError('Unknown Human Tasks operation')
        else:
            return rpc_error(request_id, -32601, 'Method not found')
    except (ValueError, TypeError, ValidationError):
        return rpc_error(request_id, -32602, 'Invalid params')
    except HTTPException as exc:
        # An inaccessible task and a missing task have the same A2A error surface.
        code = -32001 if exc.status_code in (403, 404) else -32602
        return rpc_error(request_id, code, 'Task not found' if code == -32001 else adapter.public_error(exc))
    return JSONResponse({'jsonrpc': '2.0', 'id': request_id, 'result': result},
                        headers={'Cache-Control': 'no-store', 'A2A-Version': '0.3.0'})
