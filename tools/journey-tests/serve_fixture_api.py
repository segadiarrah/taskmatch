"""Loopback-only test launcher. Payment simulation lives outside product source."""
import asyncio
import os
import sys
from contextlib import asynccontextmanager

from sqlalchemy.engine import make_url

from app.core.config import settings

if (settings.ENV!='development' or settings.STRIPE_MODE!='test'
        or make_url(settings.DATABASE_URL).database!='taskmatch_paid_test'
        or os.environ.get('TASKMATCH_JOURNEY_FIXTURE')!='local-only'
        or settings.SECRET_KEY!='journey-test-only-secret-never-production-20261118'):
    raise RuntimeError('Fixture launcher refuses non-isolated settings')

import httpx
from payment_fixture import PaymentFixture
from app.services import stripe_gateway

provider=PaymentFixture()
gateway=stripe_gateway.StripeGateway('sk_test_fixture_only',
    transport=httpx.MockTransport(provider.handle),retry_delay=0)
original_factory=stripe_gateway.get_gateway
stripe_gateway.get_gateway=lambda:gateway
from app.main import app
# Cover modules imported before the replacement without changing product files.
for module in list(sys.modules.values()):
    if getattr(module,'__name__','').startswith('app.') and getattr(module,'get_gateway',None) is original_factory:
        module.get_gateway=lambda:gateway

from fastapi import Header, HTTPException, Depends

def fixture_guard(x_journey_fixture:str=Header(default='')):
    if x_journey_fixture!='local-only':raise HTTPException(403,'Fixture control denied')

@app.get('/__journey_fixture/state',dependencies=[Depends(fixture_guard)])
async def state():
    return {'sessions':[{'id':s['id'],'job_id':s.get('client_reference_id'),
                         'status':s.get('status')} for s in provider.sessions.values()],
            'accounts':[{'id':a['id'],'user_id':a['metadata'].get('taskmatch_user_id'),
                         'ready':a['payouts_enabled']} for a in provider.accounts.values()],
            'transfers':list(provider.transfers.values()),'unexpected':provider.unexpected}

@app.post('/__journey_fixture/checkout/{ident}/complete',dependencies=[Depends(fixture_guard)])
async def complete(ident:str):
    if ident not in provider.sessions:raise HTTPException(404,'Unknown fixture session')
    provider.complete(ident)
    return {'completed':True,'simulated':True}

@app.post('/__journey_fixture/accounts/{ident}/complete',dependencies=[Depends(fixture_guard)])
async def account(ident:str):
    if ident not in provider.accounts:raise HTTPException(404,'Unknown fixture account')
    provider.complete_account(ident)
    return {'completed':True,'simulated':True}

from app.services import billing_worker
original_lifespan=app.router.lifespan_context
@asynccontextmanager
async def lifecycle(app):
    async with original_lifespan(app):
        workers=[asyncio.create_task(billing_worker.consume(execution=False)),
                 asyncio.create_task(billing_worker.consume(execution=True)),
                 asyncio.create_task(billing_worker.consume_webhooks())]
        try:yield
        finally:
            for task in workers:task.cancel()
            await asyncio.gather(*workers,return_exceptions=True)
app.router.lifespan_context=lifecycle
