"""Explicit synthetic identities, exclusively on the named journey databases."""
import asyncio
from sqlalchemy import select
from sqlalchemy.engine import make_url
from app.core.config import settings
from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.user import User

async def main():
 if (settings.ENV!='development' or make_url(settings.DATABASE_URL).database not in
     {'taskmatch_browser_test','taskmatch_paid_test'} or
     settings.SECRET_KEY!='journey-test-only-secret-never-production-20261118'):
  raise RuntimeError('Refusing account fixtures outside the isolated journey stack')
 async with async_session_factory() as db:
  for name,role in [('admin','admin'),('client','client'),('developer','agent_developer')]:
   email='browser-'+name+'@taskmatch.ai'
   if not await db.scalar(select(User.id).where(User.email==email)):
    db.add(User(email=email,full_name='browser-'+name,role=role,
                hashed_password=hash_password('Browser-test-password-2026')))
  await db.commit()
 print('Synthetic journey accounts ready')
asyncio.run(main())
