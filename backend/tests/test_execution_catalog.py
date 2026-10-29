"""Frozen provider routing and conservative prepaid budget contracts."""
import json
from unittest.mock import AsyncMock

import pytest
from app.services import providers, pricing_service, llm_service


@pytest.fixture
def provider_store(tmp_path, monkeypatch):
    monkeypatch.setattr(providers, '_DATA_DIR', str(tmp_path))
    monkeypatch.setattr(providers, '_STORE_PATH', str(tmp_path / 'providers.json'))


def test_unknown_model_rejected_without_mutating_key(provider_store):
    providers.update_provider('openai', api_key='old-key', enabled=False)
    with pytest.raises(ValueError, match='model'):
        providers.update_provider('openai', api_key='replacement', selected_model='imaginary')
    assert providers.get_provider('openai')['api_key'] == 'old-key'
    assert not providers.get_provider('openai')['enabled']


def test_current_catalog_and_unknown_rates(provider_store):
    assert 'gpt-6.1-sol' in providers.CATALOG['openai']['models']
    assert 'claude-sonnet-5-5' in providers.CATALOG['anthropic']['models']
    assert 'gemini-4-argon' in providers.CATALOG['google']['models']
    assert 'deepseek-flash' in providers.CATALOG['deepseek']['models']
    assert 'grok-4.7' in providers.CATALOG['xai']['models']
    with pytest.raises(ValueError):
        pricing_service.resolve_model_rate('unknown-expensive-model')


def test_snapshot_prices_maximum_three_attempts():
    execution = pricing_service.execution_snapshot(provider='openai', model='gpt-6.1-sol', max_input_tokens=12000, max_output_tokens=4000)
    assert execution['max_attempts'] == 3
    assert execution['per_attempt_cost_eur'] >= (12000 * 2 + 4000 * 10) / 1e6 * execution['fx_usd_to_eur']
    assert execution['max_cost_eur'] >= execution['per_attempt_cost_eur'] * 3


def test_new_quote_currency_must_be_eur():
    with pytest.raises(ValueError, match='EUR'):
        pricing_service.price_job(tasks=[], currency='USD')


@pytest.mark.asyncio
async def test_refresh_failure_preserves_disabled_config_and_last_good(provider_store, monkeypatch):
    providers.update_provider('openai', api_key='secret', enabled=False, selected_model='gpt-4o')
    monkeypatch.setattr(providers, '_fetch_models', AsyncMock(return_value=['gpt-4o']))
    await providers.refresh_provider_models('openai')
    good = providers.get_provider('openai')['models']
    monkeypatch.setattr(providers, '_fetch_models', AsyncMock(side_effect=RuntimeError('no network secret')))
    await providers.refresh_provider_models('openai')
    public = next(p for p in providers.list_providers() if p['provider'] == 'openai')
    assert public['models'] == good
    assert public['refresh_status'] == 'error'
    assert public['last_refreshed_at']
    assert public['enabled'] is False
    assert 'secret' not in json.dumps(public)


@pytest.mark.asyncio
async def test_execution_uses_frozen_model_and_provider_current_key(provider_store, monkeypatch):
    providers.update_provider('anthropic', api_key='anthropic-current', enabled=True, selected_model='claude-opus-5-5')
    execution = pricing_service.execution_snapshot(provider='anthropic', model='claude-sonnet-5-5', max_input_tokens=12000, max_output_tokens=4000)
    call = AsyncMock(return_value=('{"result":"Real result","summary":"Done"}', {'input_tokens':10,'output_tokens':20}))
    monkeypatch.setattr(llm_service, '_provider_request', call)
    result = await llm_service.execute_task_output('system', 'user', execution=execution)
    assert result['result'] == 'Real result'
    assert call.call_args.kwargs['model'] == 'claude-sonnet-5-5'
    assert call.call_args.kwargs['provider'] == 'anthropic'
    assert call.call_args.kwargs['api_key'] == 'anthropic-current'
    assert call.await_count == 1


@pytest.mark.asyncio
async def test_execution_refuses_missing_provider_and_oversized_prompt(provider_store, monkeypatch):
    call = AsyncMock()
    monkeypatch.setattr(llm_service, '_provider_request', call)
    execution = pricing_service.execution_snapshot(provider='openai', model='gpt-6.1-sol', max_input_tokens=100, max_output_tokens=100)
    with pytest.raises(llm_service.ProviderExecutionError) as missing:
        await llm_service.execute_task_output('s','u',execution=execution)
    assert not missing.value.retryable
    providers.update_provider('openai', api_key='key', enabled=True)
    with pytest.raises(llm_service.ProviderExecutionError) as oversized:
        await llm_service.execute_task_output('s','é' * 1000,execution=execution)
    assert not oversized.value.retryable
    call.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize('provider,model,endpoint,limit_key', [
    ('anthropic','claude-sonnet-5-5','/messages','max_tokens'),
    ('openai','gpt-6.1-sol','/chat/completions','max_completion_tokens'),
    ('xai','grok-4.7','/responses','max_output_tokens'),
    ('google','gemini-4-argon','/chat/completions','max_tokens'),
    ('mistral','mistral-large-4','/chat/completions','max_tokens'),
    ('deepseek','deepseek-flash','/chat/completions','max_tokens'),
    ('openrouter','openai/gpt-6.1-sol','/chat/completions','max_completion_tokens'),
])
async def test_native_payload_and_output_bound(monkeypatch, provider, model, endpoint, limit_key):
    import httpx
    calls = []
    def respond(request):
        calls.append(request)
        return httpx.Response(200, json={
            'content':[{'type':'thinking','thinking':'private'}, {'type':'text','text':'answer'}],
            'stop_reason':'end_turn',
            'status':'completed',
            'output':[{'content':[{'type':'output_text','text':'answer'}]}],
            'choices':[{'message':{'content':'answer'},'finish_reason':'stop'}],
            'usage':{'input_tokens':15,'output_tokens':25},
        })
    client = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: client(transport=httpx.MockTransport(respond), **kwargs))
    text, usage = await llm_service._provider_request(provider=provider, model=model,
        api_key='current-key', base_url='https://provider.test/v1', system_prompt='system',
        user_prompt='user', max_output_tokens=4567, timeout_seconds=10,
        response_format={'type':'json_object'})
    assert text == 'answer' and usage['output_tokens'] == 25
    assert len(calls) == 1
    request = calls[0]
    payload = json.loads(request.content)
    assert request.url.path == '/v1' + endpoint
    assert payload[limit_key] == 4567
    if provider == 'anthropic':
        assert request.headers['x-api-key'] == 'current-key'
        assert payload['system'] == 'system'
        assert payload['messages'] == [{'role':'user','content':'user'}]
        assert 'response_format' not in payload and 'temperature' not in payload
    if provider in ('openai', 'openrouter'):
        assert 'max_tokens' not in payload and 'temperature' not in payload
    if provider == 'openrouter':
        assert payload['provider']['require_parameters'] is True
        assert payload['provider']['allow_fallbacks'] is False
        assert payload['provider']['max_price'] == {'prompt':2.,'completion':10.,'request':0}


@pytest.mark.asyncio
async def test_failed_request_never_retries_or_falls_back(provider_store, monkeypatch):
    providers.update_provider('openai', api_key='key', enabled=True)
    execution = pricing_service.execution_snapshot(provider='openai', model='gpt-6.1-sol', max_input_tokens=1000, max_output_tokens=1000)
    call = AsyncMock(side_effect=RuntimeError('provider unavailable'))
    monkeypatch.setattr(llm_service, '_provider_request', call)
    with pytest.raises(llm_service.ProviderExecutionError) as error:
        await llm_service.execute_task_output('s','u',execution=execution)
    assert error.value.retryable
    assert call.await_count == 1


def test_stripe_quote_requires_provider(provider_store, monkeypatch):
    from app.services import quote_service
    from app.core.config import settings
    monkeypatch.setattr(settings, 'PAYMENT_MODE','stripe')
    with pytest.raises(ValueError, match='enabled provider'):
        quote_service.pricing_provider()


@pytest.mark.asyncio
async def test_refresh_success_keeps_unavailable_selection_visible(provider_store, monkeypatch):
    providers.update_provider('openai', api_key='key', enabled=False, selected_model='gpt-4o')
    monkeypatch.setattr(providers, '_fetch_models', AsyncMock(return_value=['gpt-6.1-sol']))
    public = await providers.refresh_provider_models('openai')
    assert public['selected_model'] == 'gpt-4o'
    assert not public['selected_model_available']
    with pytest.raises(ValueError):
        providers.update_provider('openai', selected_model='gpt-4o')


def test_frozen_budget_is_covered_by_price():
    execution = pricing_service.execution_snapshot(provider='openai', model='gpt-6-astra', max_input_tokens=32000, max_output_tokens=16000)
    quote = pricing_service.price_job(tasks=[{'title':'Write report','description':'Write report'}], model='gpt-6-astra', execution=execution)
    assert quote.subtotal >= execution['max_cost_eur']
    assert quote.platform_fee == round(quote.subtotal * .1, 2)


def test_new_job_schema_defaults_eur_and_rejects_usd():
    from pydantic import ValidationError
    from app.schemas.job import JobCreate
    payload = dict(title='A task',raw_description='Write text',budget_min=1,budget_max=10)
    assert JobCreate(**payload).currency == 'EUR'
    with pytest.raises(ValidationError):
        JobCreate(**payload, currency='USD')


def test_unverified_custom_endpoint_cannot_receive_official_pricing():
    with pytest.raises(ValueError, match='endpoint'):
        pricing_service.execution_snapshot(provider='openai',model='gpt-6.1-sol',max_input_tokens=1000,max_output_tokens=1000,base_url='https://unknown.test/v1')


@pytest.mark.asyncio
@pytest.mark.parametrize('status,retryable', [(400,False),(401,False),(403,False),(404,False),(408,True),(429,True),(500,True),(503,True)])
async def test_http_failures_classified_without_leaking_body(provider_store, monkeypatch, status, retryable):
    import httpx
    providers.update_provider('openai', api_key='private-api-key', enabled=True)
    execution = pricing_service.execution_snapshot(provider='openai', model='gpt-6.1-sol', max_input_tokens=1000, max_output_tokens=1000)
    request = httpx.Request('POST','https://api.openai.com/v1/chat/completions')
    response = httpx.Response(status,request=request,json={'error':'private-api-key'})
    call = AsyncMock(side_effect=httpx.HTTPStatusError('private-api-key',request=request,response=response))
    monkeypatch.setattr(llm_service,'_provider_request',call)
    with pytest.raises(llm_service.ProviderExecutionError) as failure:
        await llm_service.execute_task_output('sys','user',execution=execution)
    assert failure.value.retryable is retryable
    assert 'private-api-key' not in str(failure.value)
    assert call.await_count == 1
