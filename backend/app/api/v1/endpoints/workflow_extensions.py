import uuid

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, ConfigDict, Field

from app.api.v1.endpoints.human_tasks import accessible, view
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.schemas.human import HumanTaskContract
from app.services import workflow_extensions as service
from app.services.human_authorization import caller, enabled

router = APIRouter(dependencies=[Depends(enabled)])


class Dependencies(BaseModel):
    model_config = ConfigDict(extra="forbid")
    depends_on: list[uuid.UUID] = Field(max_length=50)


@router.put("/human-tasks/{task_id}/dependencies")
async def set_dependencies(
    task_id: uuid.UUID, body: Dependencies, identity=Depends(caller), db=Depends(get_db, scope="function")
):
    return await service.set_dependencies(db, task_id, body.depends_on, *identity)


@router.get("/human-tasks/{task_id}/dependencies")
async def dependencies(task_id: uuid.UUID, identity=Depends(caller), db=Depends(get_db, scope="function")):
    from sqlalchemy import select

    from app.models.workflow_extension import TaskDependency

    await accessible(db, task_id, identity)
    ids = (
        await db.scalars(
            select(TaskDependency.depends_on_task_id).where(TaskDependency.task_id == task_id)
        )
    ).all()
    return {"task_id": str(task_id), "depends_on": [str(i) for i in ids]}


@router.post("/jobs/{job_id}/amendments", status_code=201)
async def amendment(
    job_id: uuid.UUID,
    body: HumanTaskContract,
    identity=Depends(caller),
    db=Depends(get_db, scope="function"),
    idempotency_key: str = Header(min_length=1, max_length=128),
):
    return view(await service.amendment(db, job_id, body, *identity, idempotency_key))


class AIStep(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=3, max_length=512)
    instructions: str = Field(min_length=5, max_length=16000)
    task_type: str = Field(
        default="research",
        pattern=r"^(research|writing|analysis|data_analysis|coding|translation)$",
    )
    depends_on: list[uuid.UUID] = Field(default_factory=list, max_length=50)


@router.post("/jobs/{job_id}/steps", status_code=201)
async def add_ai_step(
    job_id: uuid.UUID, body: AIStep, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")
):
    from fastapi import HTTPException
    from sqlalchemy import select
    from sqlalchemy.orm import lazyload

    from app.models import Quote, Task
    from app.services.task_access import lock_job

    job = await lock_job(db, job_id)
    if job.client_user_id != user.id:
        raise HTTPException(403, "Mission belongs to another account")
    if job.status != "draft" or await db.scalar(
        select(Quote.id).where(Quote.job_id == job.id).limit(1)
    ):
        raise HTTPException(
            409, "Add steps before publication; use an amendment for funded missions"
        )
    human = await db.scalar(
        select(Task)
        .options(lazyload("*"))
        .where(Task.job_id == job.id, Task.human_contract_json.is_not(None))
        .limit(1)
    )
    if not human:
        raise HTTPException(409, "Create the human intervention before adding an analysis step")
    ids = set((await db.scalars(select(Task.id).where(Task.job_id == job.id))).all())
    if any(i not in ids for i in body.depends_on):
        raise HTTPException(422, "Prerequisites must belong to this mission")
    task = Task(
        id=uuid.uuid4(),
        job_id=job.id,
        title=body.title,
        description=body.instructions,
        task_type=body.task_type,
        status="pending",
        input_spec_json={"explicit_ai_step": True},
        output_spec_json={"required_fields": ["result"]},
    )
    db.add(task)
    await db.flush()
    from app.models.workflow_extension import TaskDependency

    for parent in set(body.depends_on):
        db.add(TaskDependency(task_id=task.id, depends_on_task_id=parent))
    job.auto_select_enabled = True
    from app.middleware.audit import log_audit

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="workflow.ai_step_created",
        entity_type="task",
        entity_id=str(task.id),
        payload={"job_id": str(job.id)},
    )
    return {
        "task_id": str(task.id),
        "job_id": str(job.id),
        "title": task.title,
        "status": task.status,
        "kind": "ai",
    }


@router.get("/jobs/{job_id}/steps")
async def steps(job_id: uuid.UUID, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    from fastapi import HTTPException
    from sqlalchemy import select
    from sqlalchemy.orm import lazyload

    from app.models import Job, Task
    from app.models.workflow_extension import TaskDependency

    job = await db.get(Job, job_id, options=[lazyload("*")])
    if not job or (job.client_user_id != user.id and user.role != "admin"):
        raise HTTPException(403, "Mission is not accessible")
    tasks = (
        await db.scalars(
            select(Task)
            .options(lazyload("*"))
            .where(Task.job_id == job_id)
            .order_by(Task.created_at, Task.id)
        )
    ).all()
    edges = (
        await db.execute(
            select(TaskDependency.task_id, TaskDependency.depends_on_task_id).where(
                TaskDependency.task_id.in_([t.id for t in tasks])
            )
        )
    ).all()
    return {
        "items": [
            {
                "task_id": str(t.id),
                "title": t.title,
                "status": t.status,
                "kind": "human" if t.human_contract_json else "ai",
                "depends_on": [str(parent) for child, parent in edges if child == t.id],
            }
            for t in tasks
        ]
    }
