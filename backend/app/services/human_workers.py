"""Worker profile and eligibility shared by new and legacy execution paths."""
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import lazyload

from app.models import Agent, User
from app.models.billing import StripeConnectAccount
from app.models.human import WorkerProfile
from app.core.config import settings


async def eligibility(db, user_id, task=None, *, accepting=True):
    profile = await db.get(WorkerProfile, user_id)
    user = await db.get(User, user_id, options=[lazyload('*')])
    account = await db.get(StripeConnectAccount, user_id)
    reasons = []
    if not profile or not user or not user.is_active:
        reasons.append('worker_profile_required')
    else:
        agent = await db.get(Agent, profile.agent_id, options=[lazyload('*')])
        if not agent or agent.status != 'active' or agent.developer_user_id != user_id or '/experts/' not in agent.endpoint_url:
            reasons.append('executor_unavailable')
        if not profile.data_consent:
            reasons.append('consent_required')
        if profile.verification_status != 'verified':
            reasons.append('identity_verification_required')
        if accepting and not profile.profile.get('available'):
            reasons.append('unavailable')
        if task:
            c = task.human_contract_json
            if c['language'] not in profile.profile.get('languages', []):
                reasons.append('language_mismatch')
            if not set(c['required_capabilities']).issubset(set(profile.profile.get('skills', []))):
                reasons.append('skills_mismatch')
            if not set(c['required_capabilities']).issubset(set(profile.attested_skills or [])):
                reasons.append('attested_skills_required')
            if c['execution_mode'] != 'remote':
                location = c['location']
                if location['country'] != profile.profile.get('country') or not profile.profile.get('service_area'):
                    reasons.append('service_area_mismatch')
    if (not account or not account.account_id or not account.payouts_enabled
            or not account.transfers_enabled
            or account.livemode != (settings.STRIPE_MODE == 'live')):
        reasons.append('payment_onboarding_required')
    return reasons


async def require_eligible_executor(db, task, agent_id, *, accepting=True):
    if not task.human_contract_json:
        return
    if accepting and datetime.fromisoformat(task.human_contract_json['deadline']) <= datetime.now(timezone.utc):
        raise HTTPException(409, 'Human Task deadline has passed')
    from app.services.human_authorization import enabled
    enabled()
    from app.models import Job
    agent = await db.get(Agent, agent_id, options=[lazyload('*')])
    job = await db.get(Job, task.job_id, options=[lazyload('*')])
    profile = await db.scalar(select(WorkerProfile).where(WorkerProfile.agent_id == agent_id))
    if task.human_policy_status != 'approved' or not agent or not profile:
        raise HTTPException(409, 'Approved Human Task and verified human executor required')
    if job.client_user_id == agent.developer_user_id:
        raise HTTPException(403, 'A requester cannot claim their own Human Task')
    reasons = await eligibility(db, agent.developer_user_id, task, accepting=accepting)
    if reasons:
        raise HTTPException(409, {'eligibility': reasons})
