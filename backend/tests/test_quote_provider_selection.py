"""Quotes use the configured execution route without provider failover."""
from unittest.mock import AsyncMock

import pytest

from app.core.config import settings
from app.services import providers, quote_service
from tests.test_execution_catalog import provider_store


def test_configured_provider_wins_over_insertion_order(provider_store, monkeypatch):
    monkeypatch.setitem(settings.__dict__, 'EXECUTION_PROVIDER', 'anthropic')
    providers.update_provider('openai', api_key='test-openai', enabled=True)
    providers.update_provider('anthropic', api_key='test-anthropic', enabled=True)
    assert quote_service.pricing_provider()['provider'] == 'anthropic'


@pytest.mark.parametrize('mode', ['stripe', 'legacy_manual'])
@pytest.mark.parametrize('selected', ['anthropic', 'unknown'])
def test_missing_selected_provider_never_uses_other_enabled_provider(provider_store, monkeypatch, mode, selected):
    monkeypatch.setitem(settings.__dict__, 'EXECUTION_PROVIDER', selected)
    monkeypatch.setattr(settings, 'PAYMENT_MODE', mode)
    providers.update_provider('openai', api_key='test-openai', enabled=True)
    with pytest.raises(ValueError, match='configured execution provider'):
        quote_service.pricing_provider()


@pytest.mark.parametrize('mode', ['stripe', 'legacy_manual'])
async def test_failed_refresh_blocks_previously_accessible_route(provider_store, monkeypatch, mode):
    monkeypatch.setitem(settings.__dict__, 'EXECUTION_PROVIDER', 'openai')
    monkeypatch.setattr(settings, 'PAYMENT_MODE', mode)
    providers.update_provider('openai', api_key='test-openai', enabled=True)
    monkeypatch.setattr(providers, '_fetch_models', AsyncMock(return_value=['gpt-6.1-sol']))
    await providers.refresh_provider_models('openai')
    monkeypatch.setattr(providers, '_fetch_models', AsyncMock(side_effect=ValueError('authorization failed')))
    await providers.refresh_provider_models('openai')
    with pytest.raises(ValueError, match='configured execution provider'):
        quote_service.pricing_provider()


def test_disabled_selected_provider_never_uses_legacy_estimate(provider_store, monkeypatch):
    monkeypatch.setitem(settings.__dict__, 'EXECUTION_PROVIDER', 'openai')
    monkeypatch.setattr(settings, 'PAYMENT_MODE', 'legacy_manual')
    providers.update_provider('openai', api_key='test-openai', enabled=False)
    with pytest.raises(ValueError, match='configured execution provider'):
        quote_service.pricing_provider()


def test_legacy_without_provider_keeps_documented_estimation_default(provider_store, monkeypatch):
    monkeypatch.setitem(settings.__dict__, 'EXECUTION_PROVIDER', 'openai')
    monkeypatch.setattr(settings, 'PAYMENT_MODE', 'legacy_manual')
    cfg = quote_service.pricing_provider()
    assert cfg['provider'] == 'openai'
    assert cfg['selected_model'] == settings.PRICING_DEFAULT_MODEL
