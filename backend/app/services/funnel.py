"""Aggregate a first-consent cohort. Browsers cannot submit commercial milestones."""
from datetime import UTC, datetime, timedelta

from sqlalchemy import text

# Bind only validated filter values; the SQL fragments below are static.
COHORT = """
WITH matched AS (
  SELECT v.id, v.account_id, v.referred_by, v.consented_at, v.language,
         u.created_at AS signup_at, u.email_verified_at, u.role, u.registration_origin,
         u.registration_attribution->>'country' AS country
  FROM measurement_visitors v LEFT JOIN users u ON u.id=v.account_id
  WHERE v.consented_at>=:start AND v.consented_at<:end
    AND (cast(:language as text) IS NULL OR v.language=:language)
    AND (cast(:country as text) IS NULL OR u.registration_attribution->>'country'=:country)
    AND (cast(:intent as text) IS NULL OR u.registration_attribution->>'intent'=:intent)
    AND (cast(:role as text) IS NULL OR u.role=:role)
    AND (cast(:source as text) IS NULL OR u.registration_attribution->>'utm_source'=:source)
    AND (cast(:campaign as text) IS NULL OR u.registration_attribution->>'utm_campaign'=:campaign)
), cohort AS (
  SELECT * FROM matched WHERE account_id IS NULL OR (registration_origin='public' AND role<>'admin')
)
"""

OBSERVED = ("landing_page_view", "cta_clicked", "registration_started", "onboarding_started")
EVENTS = (*OBSERVED, "registration_completed", "email_verified", "onboarding_completed",
          "human_profile_created", "human_profile_completed", "agent_registered", "agent_connection_verified", "project_created",
          "project_submitted", "human_task_created", "human_task_assigned", "first_payment_completed",
          "delivery_submitted", "delivery_accepted", "user_returned", "referral_registration")


def browser_event(kind):
    return f"EXISTS (SELECT 1 FROM measurement_events e WHERE e.visitor_id=c.id AND e.kind='{kind}')"


STAGES = {
    **{key: browser_event(key) for key in OBSERVED},
    "registration_completed": "account_id IS NOT NULL",
    "email_verified": "email_verified_at IS NOT NULL AND email_verified_at<:end",
    "human_profile_created": "EXISTS(SELECT 1 FROM human_workers w WHERE w.user_id=c.account_id)",
    # A completed profile is one actually saved with declared consent, skills and languages.
    "human_profile_completed": """EXISTS(SELECT 1 FROM human_workers w WHERE w.user_id=c.account_id
        AND w.data_consent AND json_array_length(w.profile->'skills')>0 AND json_array_length(w.profile->'languages')>0)""",
    "agent_registered": """EXISTS(SELECT 1 FROM agents a WHERE a.developer_user_id=c.account_id AND NOT EXISTS (
        SELECT 1 FROM human_workers w WHERE w.agent_id=a.id) AND a.endpoint_url NOT LIKE '%/experts/%')""",
    "agent_connection_verified": """EXISTS(SELECT 1 FROM agents a WHERE a.developer_user_id=c.account_id
        AND a.connection_verified_at IS NOT NULL AND a.connection_verified_at<:end)""",
    "project_created": "EXISTS(SELECT 1 FROM jobs j WHERE j.client_user_id=c.account_id)",
    "project_submitted": "EXISTS(SELECT 1 FROM audit_logs a WHERE a.actor_id=c.account_id::text AND a.action='submit_job')",
    "human_task_created": """EXISTS(SELECT 1 FROM jobs j JOIN tasks t ON t.job_id=j.id
         WHERE j.client_user_id=c.account_id AND t.human_contract_json IS NOT NULL)""",
    "human_task_assigned": """EXISTS(SELECT 1 FROM jobs j JOIN tasks t ON t.job_id=j.id
         JOIN assignments a ON a.task_id=t.id WHERE j.client_user_id=c.account_id AND t.human_contract_json IS NOT NULL)""",
    "first_payment_completed": """EXISTS(SELECT 1 FROM job_fundings f WHERE f.client_user_id=c.account_id AND f.livemode
        AND f.captured_at IS NOT NULL AND f.charge_id IS NOT NULL AND f.amount_minor>0)""",
    "delivery_submitted": """EXISTS(SELECT 1 FROM jobs j JOIN tasks t ON t.job_id=j.id JOIN submissions s ON s.task_id=t.id
        WHERE j.client_user_id=c.account_id)""",
    "delivery_accepted": """EXISTS(SELECT 1 FROM audit_logs a WHERE a.actor_id=c.account_id::text
        AND a.action IN ('accept_job','delivery.signed_off'))""",
    "user_returned": """EXISTS(SELECT 1 FROM measurement_events e WHERE e.visitor_id=c.id AND e.kind='activity'
        AND e.utc_day>(c.signup_at AT TIME ZONE 'UTC')::date)""",
    "referral_registration": "account_id IS NOT NULL AND referred_by IS NOT NULL AND account_id<>referred_by",
}


ACTIVATION = "project_submitted OR human_profile_completed OR agent_registered OR human_task_created"


async def referral_stats(db, owner_id):
    """Only distinct consenting browsers and their eligible new accounts reach this aggregate."""
    end = datetime.now(UTC)
    metrics = ("landing_page_view", "email_verified", "first_payment_completed",
               "project_submitted", "human_profile_completed", "agent_registered", "human_task_created")
    evidence = ", ".join(f"{STAGES[key]} AS {key}" for key in metrics)
    query = text(f"""
        WITH cohort AS (
            SELECT v.id, v.account_id, u.email_verified_at FROM measurement_visitors v
            LEFT JOIN users u ON u.id=v.account_id
            WHERE v.referred_by=:owner AND v.consented_at>=:start AND v.consented_at<:end
            AND (v.account_id IS NULL OR (v.account_id<>:owner AND u.registration_origin='public' AND u.role<>'admin'))
        ), observed AS (SELECT {evidence} FROM cohort c)
        SELECT count(*) FILTER(WHERE landing_page_view) AS visits,
            count(*) FILTER(WHERE email_verified) AS verified_signups,
            count(*) FILTER(WHERE {ACTIVATION}) AS activations,
            count(*) FILTER(WHERE first_payment_completed) AS first_captures FROM observed
    """)
    from app.services.measurement import DAYS
    return dict((await db.execute(query, {"owner":owner_id, "start":end-timedelta(days=DAYS), "end":end})).mappings().one())


def ratio(numerator, denominator):
    return {"numerator": numerator, "denominator": denominator,
            "rate": round(numerator / denominator, 6) if denominator else None}


async def report(db, days, **filters):
    end = datetime.now(UTC)
    params = {**filters, "start": end - timedelta(days=days), "end": end, "today": end.date()}
    columns = [f"{value} AS {key}" for key, value in STAGES.items()]
    maturity = []
    for day in (1, 7, 30):
        # Ignore any signup whose Nth UTC day is still in progress.
        target = f"((signup_at AT TIME ZONE 'UTC')::date+{day})"
        maturity += [f"count(*) FILTER(WHERE {target}<:today) AS eligible_{day}",
            f"""count(*) FILTER(WHERE {target}<:today AND EXISTS(SELECT 1 FROM measurement_events e
                WHERE e.visitor_id=d.id AND e.kind='activity' AND e.utc_day={target})) AS retained_{day}"""]
    measured = ', '.join(f"count(*) FILTER(WHERE {key}) AS {key}" for key in STAGES)
    statement = COHORT + ", details AS (SELECT c.*, " + ", ".join(columns) + " FROM cohort c) " + f"""
    SELECT count(*) AS visitors, (SELECT count(*) FROM matched) - count(*) AS excluded,
        {measured}, count(*) FILTER (WHERE {ACTIVATION}) AS onboarding_completed,
        count(*) FILTER (WHERE landing_page_view AND cta_clicked) AS landing_cta,
        count(*) FILTER (WHERE registration_started AND registration_completed) AS started_signup,
        {', '.join(maturity)} FROM details d"""
    counts = (await db.execute(text(statement), params)).mappings().one()
    events = {key: counts[key] for key in EVENTS}
    revenue = (await db.execute(text(COHORT + """
        SELECT coalesce(sum(f.amount_minor),0)::bigint AS gross_captured_minor,
            coalesce(sum(f.refunded_minor),0)::bigint AS refunded_minor,
            coalesce(sum(f.amount_minor-f.refunded_minor),0)::bigint AS net_collected_minor,
            coalesce(sum(q.platform_fee*100),0)::bigint AS quoted_platform_fee_minor
        FROM cohort c JOIN job_fundings f ON f.client_user_id=c.account_id JOIN quotes q ON q.id=f.quote_id
        WHERE f.livemode AND f.captured_at IS NOT NULL AND f.charge_id IS NOT NULL AND f.currency='eur'
    """), params)).mappings().one()
    dimensions = (await db.execute(text(COHORT + """
        SELECT language, country, count(*) AS visitors, count(account_id) AS registrations
        FROM cohort GROUP BY language,country ORDER BY visitors DESC,language,country
    """), params)).mappings().all()
    return {"start_utc": params["start"], "end_utc": end, "cohort_visitors": counts["visitors"],
        "excluded": counts["excluded"], "events": events,
        "rates": {"cta":ratio(counts["landing_cta"], events["landing_page_view"]),
                  "signup":ratio(counts["started_signup"], events["registration_started"]),
                  "onboarding":ratio(events["onboarding_completed"],events["registration_completed"]),
                  "paid":ratio(events["first_payment_completed"],events["registration_completed"])},
        "retention":{f"D{day}":{"eligible":counts[f"eligible_{day}"],"returned":counts[f"retained_{day}"],
                                  "rate":ratio(counts[f"retained_{day}"],counts[f"eligible_{day}"])["rate"]}
                     for day in (1,7,30)}, "money":{"currency":"EUR",**dict(revenue)}, "dimensions":[dict(d) for d in dimensions]}
