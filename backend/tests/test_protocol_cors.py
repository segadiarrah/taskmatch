"""Browser clients can send the required protocol metadata from allowed origins."""
import httpx

from app.core.config import settings
from app.main import app


async def test_protocol_metadata_passes_configured_origin_preflight():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        result = await client.options('/api/v1/protocols/mcp', headers={
            'Origin': settings.CORS_ORIGINS[0], 'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization,content-type,mcp-protocol-version,mcp-method,mcp-name,a2a-version'})
    assert result.status_code == 200, result.text
    assert result.headers['access-control-allow-origin'] == settings.CORS_ORIGINS[0]


async def test_protocol_metadata_does_not_enable_untrusted_origins():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        result = await client.options('/api/v1/protocols/mcp', headers={
            'Origin': 'https://untrusted.example.test', 'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'mcp-method,mcp-protocol-version'})
    assert result.status_code == 400
    assert 'access-control-allow-origin' not in result.headers
