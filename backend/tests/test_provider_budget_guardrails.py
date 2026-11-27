"""Rate drift and catalog integrity must fail before committing new spending."""
import copy
from unittest.mock import AsyncMock

import httpx
import pytest

from app.services import llm_service, model_catalog, pricing_service, providers


@pytest.fixture
def store(monkeypatch):
    state = {}
    monkeypatch.setattr(providers, '_load', lambda: copy.deepcopy(state))
    def save(value):
        state.clear()
        state.update(copy.deepcopy(value))
    monkeypatch.setattr(providers, '_save', save)
    return state


@pytest.mark.asyncio
@pytest.mark.parametrize('provider,model', [('openai', 'gpt-6-luna'), ('anthropic', 'claude-sonnet-5-5')])
async def test_direct_rate_increase_cannot_spend_past_frozen_budget(store, monkeypatch, provider, model):
    providers.update_provider(provider, api_key='test-key', enabled=True, selected_model=model)
    snapshot = pricing_service.execution_snapshot(provider=provider, model=model, max_input_tokens=1000, max_output_tokens=1000)
    frozen = copy.deepcopy(snapshot)
    rates = model_catalog.MODEL_RATES[provider][model]
    monkeypatch.setitem(model_catalog.MODEL_RATES[provider], model, tuple(rate * 100 for rate in rates))
    request = AsyncMock(return_value=('{"result":"generated"}', {}))
    monkeypatch.setattr(llm_service, '_provider_request', request)
    with pytest.raises(llm_service.ProviderExecutionError, match='frozen execution budget') as error:
        await llm_service.execute_task_output('system', 'user', execution=snapshot)
    assert not error.value.retryable
    request.assert_not_called()
    assert snapshot == frozen


@pytest.mark.asyncio
async def test_cheaper_direct_rates_leave_accepted_snapshot_unchanged(store, monkeypatch):
    providers.update_provider('openai', api_key='test-key', enabled=True, selected_model='gpt-6-luna')
    snapshot = pricing_service.execution_snapshot(provider='openai', model='gpt-6-luna', max_input_tokens=1000, max_output_tokens=1000)
    frozen = copy.deepcopy(snapshot)
    monkeypatch.setitem(model_catalog.MODEL_RATES['openai'], 'gpt-6-luna', (.05, .25))
    request = AsyncMock(return_value=('{"result":"generated"}', {}))
    monkeypatch.setattr(llm_service, '_provider_request', request)
    assert (await llm_service.execute_task_output('system', 'user', execution=snapshot))['result'] == 'generated'
    assert request.await_count == 1
    assert snapshot == frozen


@pytest.mark.asyncio
@pytest.mark.parametrize('body', [{}, {'data': None}, {'data': {}}, {'data': [{}]}, {'data': [{'id': 7}]}, {'data': [{'id': 'gpt-6-luna'}], 'has_more': True}])
async def test_malformed_catalog_retains_last_good_models(store, monkeypatch, body):
    providers.update_provider('openai', api_key='test-key', enabled=True, selected_model='gpt-6-luna')
    store['openai'].update(available_models=['gpt-6-luna'], refresh_status='success', last_refreshed_at='2026-10-29T00:00:00+00:00')
    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original(transport=httpx.MockTransport(lambda request: httpx.Response(200, json=body)), **kwargs))
    result = await providers.refresh_provider_models('openai')
    assert result['refresh_status'] == 'error'
    assert result['models'] == ['gpt-6-luna']
    assert result['last_refreshed_at'] == '2026-10-29T00:00:00+00:00'


@pytest.mark.asyncio
async def test_valid_empty_model_list_can_mark_account_models_unavailable(store, monkeypatch):
    providers.update_provider('openai', api_key='test-key', enabled=True, selected_model='gpt-6-luna')
    store['openai'].update(available_models=['gpt-6-luna'], refresh_status='success')
    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={'data': []})), **kwargs))
    result = await providers.refresh_provider_models('openai')
    assert result['refresh_status'] == 'success'
    assert result['models'] == []
    assert not result['selected_model_available']


@pytest.mark.parametrize('change', [{'api_key': 'replacement-key'}, {'base_url': 'https://other.test/v1'}])
def test_provider_identity_change_invalidates_account_verification(store, change):
    providers.update_provider('openai', api_key='old-key', enabled=False, selected_model='gpt-6-luna')
    store['openai'].update(available_models=['gpt-6-luna'], refresh_status='success', last_refreshed_at='2026-10-29T00:00:00+00:00')
    result = providers.update_provider('openai', **change)
    assert not result['enabled']
    assert result['selected_model'] == 'gpt-6-luna'
    assert result['models'] == []
    assert result['last_refreshed_at'] is None
    assert not result['selected_model_available']


@pytest.mark.asyncio
async def test_old_account_refresh_cannot_verify_replacement_key(store, monkeypatch):
    providers.update_provider('openai', api_key='old-key', enabled=True, selected_model='gpt-6-luna')
    async def old_response(provider, config):
        providers.update_provider(provider, api_key='replacement-key')
        return ['gpt-6-luna']
    monkeypatch.setattr(providers, '_fetch_models', old_response)
    result = await providers.refresh_provider_models('openai')
    assert result['models'] == []
    assert result['last_refreshed_at'] is None
    assert result['refresh_status'] != 'success'
    assert providers.get_provider('openai')['api_key'] == 'replacement-key'


@pytest.mark.asyncio
async def test_older_refresh_cannot_replace_newer_catalog(store, monkeypatch):
    providers.update_provider('openai', api_key='test-key', enabled=True, selected_model='gpt-6-luna')
    calls = 0
    async def fetch(provider, config):
        nonlocal calls
        calls += 1
        if calls == 1:
            await providers.refresh_provider_models(provider)
            return ['gpt-6-luna']
        return ['gpt-6.1-sol']
    monkeypatch.setattr(providers, '_fetch_models', fetch)
    result = await providers.refresh_provider_models('openai')
    assert result['models'] == ['gpt-6.1-sol']
    assert not result['selected_model_available']


def test_unchanged_key_and_endpoint_keep_account_verification(store):
    providers.update_provider('openai', api_key='test-key', enabled=True, selected_model='gpt-6-luna')
    store['openai'].update(available_models=['gpt-6-luna'], refresh_status='success', last_refreshed_at='2026-10-29T00:00:00+00:00')
    result = providers.update_provider('openai', api_key=' test-key ', base_url='https://api.openai.com/v1/', enabled=False)
    assert result['models'] == ['gpt-6-luna']
    assert result['last_refreshed_at'] == '2026-10-29T00:00:00+00:00'
    assert not result['enabled']


@pytest.mark.asyncio
async def test_openrouter_retains_frozen_request_ceiling_when_catalog_rates_rise(store, monkeypatch):
    provider, model = 'openrouter', 'openai/gpt-6.1-sol'
    providers.update_provider(provider, api_key='test-key', enabled=True, selected_model=model)
    snapshot = pricing_service.execution_snapshot(provider=provider, model=model, max_input_tokens=1000, max_output_tokens=1000)
    frozen = copy.deepcopy(snapshot)
    monkeypatch.setitem(model_catalog.MODEL_RATES[provider], model, (200., 1000.))
    calls = []
    def respond(request):
        import json
        calls.append(json.loads(request.content))
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': '{"result":"generated"}'}}]})
    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original(transport=httpx.MockTransport(respond), **kwargs))
    result = await llm_service.execute_task_output('system', 'user', execution=snapshot)
    assert result['result'] == 'generated'
    assert calls[0]['provider']['max_price'] == {'prompt': frozen['rates']['input_usd_per_million'], 'completion': frozen['rates']['output_usd_per_million'], 'request': 0}
    assert snapshot == frozen
