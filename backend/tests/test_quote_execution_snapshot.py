"""Database evidence that quote acceptance freezes the executable model budget."""
import pytest
from sqlalchemy import select
from test_lifecycle_integration import market, planned_job
from app.core.config import settings
from app.models.quote import TaskQuote
from app.services import providers


@pytest.mark.asyncio
async def test_persisted_quote_freezes_provider_and_rates(market, tmp_path, monkeypatch):
    monkeypatch.setattr(providers, '_DATA_DIR', str(tmp_path))
    monkeypatch.setattr(providers, '_STORE_PATH', str(tmp_path / 'providers.json'))
    monkeypatch.setattr(settings, 'EXECUTION_PROVIDER', 'anthropic')
    providers.update_provider('anthropic', api_key='fake-key', enabled=True, selected_model='claude-sonnet-5-5')
    plan = await planned_job(market)
    async with market.db() as db:
        tq = (await db.execute(select(TaskQuote))).scalars().first()
        execution = tq.breakdown_json['execution']
        assert execution['provider'] == 'anthropic'
        assert execution['model'] == 'claude-sonnet-5-5'
        assert execution['max_attempts'] == 3
        assert float(tq.price) >= execution['max_cost_eur']
        providers.update_provider('anthropic', selected_model='claude-opus-5-5')
        await db.refresh(tq)
        assert tq.breakdown_json['execution'] == execution
    assert plan['quote']['currency'] == 'EUR'


@pytest.mark.asyncio
async def test_invalid_admin_model_returns_422_without_changing_config(market, tmp_path, monkeypatch):
    monkeypatch.setattr(providers, '_DATA_DIR', str(tmp_path))
    monkeypatch.setattr(providers, '_STORE_PATH', str(tmp_path / 'providers.json'))
    providers.update_provider('openai', api_key='kept-key', enabled=False)
    response = await market.http.put('/admin/providers/openai', headers=market.headers['admin'],
        json={'selected_model':'made-up-model','api_key':'replacement','enabled':True})
    assert response.status_code == 422
    assert providers.get_provider('openai')['api_key'] == 'kept-key'
    assert not providers.get_provider('openai')['enabled']


@pytest.mark.asyncio
async def test_catalog_refresh_is_admin_only_and_does_not_activate_provider(market, tmp_path, monkeypatch):
    from unittest.mock import AsyncMock
    monkeypatch.setattr(providers, '_DATA_DIR', str(tmp_path))
    monkeypatch.setattr(providers, '_STORE_PATH', str(tmp_path / 'providers.json'))
    providers.update_provider('openai', api_key='key', enabled=False)
    monkeypatch.setattr(providers, '_fetch_models', AsyncMock(return_value=['gpt-6.1-sol']))
    denied = await market.http.post('/admin/providers/openai/refresh', headers=market.headers['owner'])
    assert denied.status_code == 403
    ok = await market.http.post('/admin/providers/openai/refresh', headers=market.headers['admin'])
    assert ok.status_code == 200
    assert ok.json()['provider']['refresh_status'] == 'success'
    assert not ok.json()['provider']['enabled']


@pytest.mark.asyncio
async def test_all_human_quote_needs_no_llm_provider(market, tmp_path, monkeypatch):
    from app.core.config import settings
    from test_lifecycle_integration import request
    monkeypatch.setattr(providers, '_DATA_DIR', str(tmp_path))
    monkeypatch.setattr(providers, '_STORE_PATH', str(tmp_path / 'providers.json'))
    monkeypatch.setattr(settings, 'PAYMENT_MODE', 'stripe')
    job = await request(market, 'POST', '/jobs', expected=201,
        json={'title':'Install production server','raw_description':'Install a production server on site.',
              'budget_min':1,'budget_max':1000,'auto_select_enabled':False})
    await request(market, 'POST', f"/jobs/{job['id']}/submit")
    async with market.db() as db:
        lines = (await db.execute(select(TaskQuote))).scalars().all()
        assert lines
        for tq in lines:
            assert tq.route == 'human'
            assert tq.breakdown_json.get('execution') is None
