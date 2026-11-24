"""MCP 2026-07-28 Streamable HTTP, stateless JSON responses and scoped tools."""
import base64
import binascii
import json
import math
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.services import protocol_adapters as adapter
from app.services.human_authorization import caller, enabled

VERSION = '2026-07-28'
SERVER_INFO = {'name': 'TaskMatch Human Tasks', 'version': '1.0.0'}


def check_origin(request: Request):
    origin = request.headers.get('origin')
    if origin is not None and origin not in settings.CORS_ORIGINS:
        raise HTTPException(403, 'Origin is not allowed')


router = APIRouter(dependencies=[Depends(check_origin), Depends(enabled)])


def rpc_error(request_id, code, message, status=200, data=None):
    error = {'code': code, 'message': message}
    if data is not None:
        error['data'] = data
    return JSONResponse({'jsonrpc': '2.0', 'id': request_id, 'error': error}, status_code=status,
                        headers={'Cache-Control': 'no-store'})


def reject_constant(value):
    raise ValueError('Non-finite JSON number')


async def read_rpc(request, *, allow_notifications=False):
    raw = bytearray()
    async for chunk in request.stream():
        if len(raw)+len(chunk) > 262144:
            return None, rpc_error(None, -32600, 'Request is too large', 413)
        raw.extend(chunk)
    try:
        body = json.loads(raw, parse_constant=reject_constant)
    except (ValueError, UnicodeDecodeError):
        return None, rpc_error(None, -32700, 'Parse error', 400)
    if (not isinstance(body, dict) or body.get('jsonrpc') != '2.0'
            or not isinstance(body.get('method'), str) or not body['method']
            or ('id' not in body and not allow_notifications)
            or ('id' in body and (isinstance(body['id'], bool)
                or not isinstance(body['id'], (str, int, float))
                or (isinstance(body['id'], float) and not math.isfinite(body['id']))))
            or 'result' in body or 'error' in body
            or not isinstance(body.get('params', {}), dict)):
        return None, rpc_error(None, -32600, 'Invalid request', 400)
    return body, None


def decode_header(value):
    if value is None or value != value.strip() or any(ord(c) < 32 or ord(c) > 126 for c in value):
        raise ValueError('Malformed header')
    if value.startswith('=?base64?') and value.endswith('?='):
        return base64.b64decode(value[9:-2], validate=True).decode('utf-8')
    return value


@router.post('/protocols/mcp')
async def mcp(request: Request, identity: Annotated[tuple, Depends(caller)], db: Annotated[AsyncSession, Depends(get_db, scope="function")]):
    body, error = await read_rpc(request, allow_notifications=True)
    if error is not None:
        return error
    request_id, method = body.get('id'), body['method']
    if request.headers.get('content-type', '').split(';')[0] != 'application/json':
        return rpc_error(request_id, -32600, 'Content-Type must be application/json', 415)
    accept = request.headers.get('accept', '')
    if not all(value in accept for value in ('application/json', 'text/event-stream')):
        return rpc_error(request_id, -32600, 'Accept must include application/json and text/event-stream', 406)
    version = request.headers.get('mcp-protocol-version')
    if not version:
        return rpc_error(request_id, -32020, 'Header mismatch: MCP-Protocol-Version is required', 400)
    if version != VERSION:
        return rpc_error(request_id, -32022, 'Unsupported protocol version', 400,
                         {'supported': [VERSION], 'requested': version})
    params = body.get('params', {})
    if 'id' not in body:
        # This server has no long-running MCP requests. A cancellation of an
        # already-finished/unknown request is explicitly a harmless no-op.
        request_to_cancel = params.get('requestId')
        if (method != 'notifications/cancelled' or isinstance(request_to_cancel, bool)
                or not isinstance(request_to_cancel, (str, int, float))
                or (isinstance(request_to_cancel, float) and not math.isfinite(request_to_cancel))):
            return rpc_error(None, -32600, 'Unsupported notification', 400)
        return Response(status_code=202, headers={'Cache-Control': 'no-store'})
    meta = params.get('_meta')
    try:
        if (not isinstance(meta, dict) or meta.get('io.modelcontextprotocol/protocolVersion') != version
                or decode_header(request.headers.get('mcp-method')) != method
                or (method == 'tools/call' and decode_header(request.headers.get('mcp-name')) != params.get('name'))):
            raise ValueError('Header mismatch')
    except (ValueError, UnicodeDecodeError, binascii.Error):
        return rpc_error(request_id, -32020, 'Header mismatch', 400)
    if not isinstance(meta.get('io.modelcontextprotocol/clientCapabilities'), dict):
        return rpc_error(request_id, -32602, 'clientCapabilities metadata is required', 400)
    if method == 'server/discover':
        result = {'supportedVersions': [VERSION], 'capabilities': {'tools': {}},
                  'instructions': 'Use principal-scoped Human Tasks tools; poll for events and approved results.'}
    elif method == 'ping':
        result = {}
    elif method == 'tools/list':
        if params.get('cursor'):
            return rpc_error(request_id, -32602, 'Invalid cursor')
        result = {'tools': adapter.tools(), 'ttlMs': 0, 'cacheScope': 'private'}
    elif method == 'tools/call':
        name, arguments = params.get('name'), params.get('arguments', {})
        if not isinstance(name, str) or name not in adapter.OPERATIONS or not isinstance(arguments, dict):
            return rpc_error(request_id, -32602, 'Unknown tool or malformed tool call')
        try:
            result = adapter.tool_content(await adapter.execute(db, identity, name, arguments))
        except ValidationError:
            result = adapter.tool_content({'message': 'Invalid tool arguments', 'status': 422}, error=True)
        except HTTPException as exc:
            result = adapter.tool_content({'message': adapter.public_error(exc), 'status': exc.status_code}, error=True)
    else:
        return rpc_error(request_id, -32601, 'Method not found', 404)
    result.update({'resultType': 'complete', '_meta': {'io.modelcontextprotocol/serverInfo': SERVER_INFO}})
    return JSONResponse({'jsonrpc': '2.0', 'id': request_id, 'result': result},
                        headers={'Cache-Control': 'no-store', 'MCP-Protocol-Version': VERSION})
