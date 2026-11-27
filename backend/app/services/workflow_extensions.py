"""Safe composition and separately funded amendments, without rewriting ledgers."""

import uuid

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import lazyload

from app.middleware.audit import log_audit
from app.models import Job, Quote, Task
from app.models.workflow_extension import TaskDependency
from app.services.human_authorization import owned_principal
from app.services.human_tasks import create_contract
from app.services.task_access import lock_job


async def require_dependencies(db, task):
    pending = await db.scalar(
        select(TaskDependency.depends_on_task_id)
        .join(Task, Task.id == TaskDependency.depends_on_task_id)
        .where(TaskDependency.task_id == task.id, Task.status != "approved")
        .limit(1)
    )
    if pending:
        raise HTTPException(
            409, "Complete and approve the prerequisite missions before starting this task"
        )


async def set_dependencies(db, task_id, depends_on, user, delegation):
    task = await db.get(Task, task_id, options=[lazyload("*")])
    if not task or not task.human_contract_json:
        raise HTTPException(404, "Human Task not found")
    await owned_principal(db, uuid.UUID(task.human_contract_json["principal_id"]), user, lock=True)
    if delegation:
        from app.models.human import Delegation
        from app.services.billing_service import now

        delegation = await db.scalar(
            select(Delegation)
            .where(Delegation.id == delegation.id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if not delegation or delegation.revoked_at or delegation.expires_at <= now():
            raise HTTPException(403, "The spending mandate is no longer active")
    job = await lock_job(db, task.job_id)
    if delegation and task.human_contract_json.get("delegation_id") != str(delegation.id):
        raise HTTPException(403, "Task is outside this mandate")
    if job.status != "draft" or await db.scalar(
        select(Quote.id).where(Quote.job_id == job.id).limit(1)
    ):
        raise HTTPException(
            409, "Workflow dependencies must be configured before publication and funding"
        )
    tasks = (
        await db.scalars(select(Task).options(lazyload("*")).where(Task.job_id == job.id))
    ).all()
    by_id = {t.id: t for t in tasks}
    if task_id in depends_on or any(t not in by_id for t in depends_on):
        raise HTTPException(422, "Prerequisites must be other tasks in the same mission")
    if delegation and any(
        (by_id[t].human_contract_json or {}).get("delegation_id") != str(delegation.id)
        for t in depends_on
    ):
        raise HTTPException(403, "A mandate cannot depend on another private mandate")
    edges = (
        await db.execute(
            select(TaskDependency.task_id, TaskDependency.depends_on_task_id).where(
                TaskDependency.task_id.in_(by_id)
            )
        )
    ).all()
    graph = {t: set() for t in by_id}
    for child, parent in edges:
        if child != task_id:
            graph[child].add(parent)
    graph[task_id] = set(depends_on)
    active = set()
    done = set()

    def visit(node):
        if node in active:
            raise HTTPException(422, "Task dependencies must not form a cycle")
        if node in done:
            return
        active.add(node)
        for parent in graph[node]:
            visit(parent)
        active.remove(node)
        done.add(node)

    for node in graph:
        visit(node)
    await db.execute(delete(TaskDependency).where(TaskDependency.task_id == task_id))
    for parent in set(depends_on):
        db.add(TaskDependency(task_id=task_id, depends_on_task_id=parent))
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="human_task.dependencies_set",
        entity_type="task",
        entity_id=str(task_id),
        payload={"depends_on": [str(t) for t in depends_on]},
    )
    return {"task_id": str(task_id), "depends_on": [str(t) for t in sorted(set(depends_on))]}


async def amendment(db, job_id, body, user, delegation, key):
    if body.parent_job_id or body.parent_task_id:
        raise HTTPException(422, "An amendment starts its own separately priced mission")
    # create_contract acquires principal -> delegation -> new job. The original is
    # only read: its financial and execution state is never mutated by amendment.
    original = await db.get(Job, job_id, options=[lazyload("*")])
    if not original or original.client_user_id != user.id:
        raise HTTPException(403, "Original mission is not owned by this account")
    if delegation:
        original_tasks = (
            await db.scalars(select(Task).options(lazyload("*")).where(Task.job_id == original.id))
        ).all()
        if not original_tasks or any(
            not t.human_contract_json
            or t.human_contract_json.get("principal_id") != str(body.principal_id)
            or t.human_contract_json.get("delegation_id") != str(delegation.id)
            for t in original_tasks
        ):
            raise HTTPException(403, "The original mission is outside this spending mandate")
    import hashlib

    amendment_key = "amend:" + str(job_id) + ":" + hashlib.sha256(key.encode()).hexdigest()
    task = await create_contract(db, body, user, delegation, amendment_key)
    job = await db.get(Job, task.job_id, options=[lazyload("*")])
    previous = (job.metadata_json or {}).get("amends_job_id")
    if previous and previous != str(job_id):
        raise HTTPException(409, "The amendment key is already bound to another mission")
    job.metadata_json = {**(job.metadata_json or {}), "amends_job_id": str(job_id)}
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="human_task.amendment_created",
        entity_type="task",
        entity_id=str(task.id),
        payload={"amends_job_id": str(job_id), "new_job_id": str(job.id)},
    )
    return task


async def release_dependents(db, task):
    from app.services.task_execution import queue_task

    tasks = (
        await db.scalars(
            select(Task)
            .options(lazyload("*"))
            .join(TaskDependency, TaskDependency.task_id == Task.id)
            .where(TaskDependency.depends_on_task_id == task.id)
        )
    ).all()
    job = await db.get(Job, task.job_id, options=[lazyload("*")])
    for dependent in tasks:
        try:
            await require_dependencies(db, dependent)
        except HTTPException:
            continue
        await queue_task(db, job, dependent)
        await log_audit(
            db,
            actor_type="system",
            actor_id="workflow",
            action="human_task.prerequisites_satisfied",
            entity_type="task",
            entity_id=str(dependent.id),
            payload={"approved_task_id": str(task.id)},
        )
