"""The signup response must not race an immediate login on another connection."""
import httpx
from sqlalchemy import select
from app.main import app
from app.models import User
from test_lifecycle_integration import market


async def test_registration_is_committed_before_success_response(market):
    visible=[]
    email='response-boundary@example.com'
    async def boundary(scope,receive,send):
        async def observe(message):
            if message['type']=='http.response.start' and message['status']==201:
                async with market.db() as db:
                    visible.append(await db.scalar(select(User.id).where(User.email==email)) is not None)
            await send(message)
        await app(scope,receive,observe)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=boundary),base_url='http://test/api/v1') as client:
        response=await client.post('/auth/register',json={
            'email':email,'password':'Durable-test-password-2026','full_name':'Boundary test','role':'client'})
        assert response.status_code==201
    assert visible==[True], '201 must mean a subsequent connection can already log in'
    response=await market.http.post('/auth/login',data={'username':email,'password':'Durable-test-password-2026'})
    assert response.status_code==200
