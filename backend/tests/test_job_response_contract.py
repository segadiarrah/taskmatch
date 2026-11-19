"""The real job response supplies the funding discriminator consumed by the UI."""
import pytest
from app.core.config import settings
from test_lifecycle_integration import market, request


@pytest.mark.parametrize('mode',['legacy_manual','stripe'])
async def test_job_response_preserves_its_billing_mode(market,monkeypatch,mode):
    monkeypatch.setattr(settings,'PAYMENT_MODE',mode)
    created=await request(market,'POST','/jobs',expected=201,json={
        'title':'Billing contract regression','raw_description':'Write a reviewed report.',
        'budget_min':1,'budget_max':100,'currency':'EUR','auto_select_enabled':False})
    assert created['billing_mode']==mode
    read=await request(market,'GET',f"/jobs/{created['id']}")
    assert read['billing_mode']==mode
    funding=await request(market,'GET',f"/billing/jobs/{created['id']}")
    assert funding['billing_mode']==mode
