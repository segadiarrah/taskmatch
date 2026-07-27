"""Bid management endpoints."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.agent import Agent
from app.models.assignment import Assignment, AssignmentStatus
from app.models.bid import Bid, BidStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.bid import BidCreate, BidListResponse, BidResponse

router = APIRouter()


@router.post(
    "/tasks/{task_id}/bids",
    response_model=BidResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a bid on a task",
)
async def create_bid(
    task_id: uuid.UUID,
    body: BidCreate,
    current_user: User = Depends(require_role("agent_developer")),
    db: AsyncSession = Depends(get_db),
) -> BidResponse:
    """Submit a bid for a task.

    The caller must have the ``agent_developer`` role and must own the agent
    specified in the bid.  The task must be open for bidding.
    """
    # Validate task exists and is open for bids.
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    if task.status != TaskStatus.open_for_bids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is in '{task.status}' status and is not accepting bids",
        )

    # Validate the agent belongs to the current user.
    agent_result = await db.execute(select(Agent).where(Agent.id == body.agent_id))
    agent = agent_result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )
    if agent.developer_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit bids with your own agents",
        )

    # Check for duplicate bid from the same agent on this task.
    existing_bid_result = await db.execute(
        select(Bid).where(
            Bid.task_id == task_id,
            Bid.agent_id == body.agent_id,
            Bid.status.in_(["submitted", "shortlisted"]),
        )
    )
    if existing_bid_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This agent already has an active bid on this task",
        )

    bid = Bid(
        id=uuid.uuid4(),
        task_id=task_id,
        agent_id=body.agent_id,
        price=body.price,
        eta_hours=body.eta_hours,
        confidence_score=body.confidence_score,
        proposal_text=body.proposal_text,
        status=BidStatus.submitted,
    )
    db.add(bid)
    await db.flush()
    await db.refresh(bid)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="create_bid",
        entity_type="bid",
        entity_id=str(bid.id),
        payload={"task_id": str(task_id), "agent_id": str(body.agent_id), "price": float(body.price)},
    )

    resp = BidResponse.model_validate(bid)
    resp.agent_name = agent.name
    return resp


@router.get(
    "/tasks/{task_id}/bids",
    response_model=BidListResponse,
    summary="List bids for a task",
)
async def list_bids(
    task_id: uuid.UUID,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> BidListResponse:
    """Return a paginated list of bids for a specific task."""
    # Verify task exists.
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    if task_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    query = select(Bid).where(Bid.task_id == task_id)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Bid.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    bids = result.scalars().all()

    bid_responses = []
    for bid in bids:
        resp = BidResponse.model_validate(bid)
        if bid.agent:
            resp.agent_name = bid.agent.name
        bid_responses.append(resp)

    return BidListResponse(bids=bid_responses, total=total)


@router.put(
    "/bids/{bid_id}/select",
    response_model=BidResponse,
    summary="Select a bid (admin)",
)
async def select_bid(
    bid_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> BidResponse:
    """Select a winning bid.

    Marks the bid as ``selected``, creates an assignment linking the agent to
    the task, and transitions the task to ``assigned`` status.  All other
    pending bids on the same task are automatically rejected.
    """
    result = await db.execute(select(Bid).where(Bid.id == bid_id))
    bid = result.scalar_one_or_none()
    if bid is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found",
        )

    if bid.status != BidStatus.submitted and bid.status != BidStatus.shortlisted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bid is in '{bid.status}' status and cannot be selected",
        )

    # Select this bid.
    bid.status = BidStatus.selected
    await db.flush()

    # Reject all other active bids on the same task.
    other_bids_result = await db.execute(
        select(Bid).where(
            Bid.task_id == bid.task_id,
            Bid.id != bid.id,
            Bid.status.in_(["submitted", "shortlisted"]),
        )
    )
    for other_bid in other_bids_result.scalars().all():
        other_bid.status = BidStatus.rejected

    # Create an assignment for the winning bid.
    assignment = Assignment(
        id=uuid.uuid4(),
        task_id=bid.task_id,
        agent_id=bid.agent_id,
        bid_id=bid.id,
        status=AssignmentStatus.active,
    )
    db.add(assignment)

    # Transition the task to assigned.
    task_result = await db.execute(select(Task).where(Task.id == bid.task_id))
    task = task_result.scalar_one_or_none()
    if task:
        task.status = TaskStatus.assigned

    await db.flush()
    await db.refresh(bid)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="select_bid",
        entity_type="bid",
        entity_id=str(bid.id),
        payload={
            "task_id": str(bid.task_id),
            "agent_id": str(bid.agent_id),
            "assignment_id": str(assignment.id),
        },
    )

    resp = BidResponse.model_validate(bid)
    if bid.agent:
        resp.agent_name = bid.agent.name
    return resp


@router.put(
    "/bids/{bid_id}/reject",
    response_model=BidResponse,
    summary="Reject a bid",
)
async def reject_bid(
    bid_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> BidResponse:
    """Reject a bid.  Only admins may reject bids."""
    result = await db.execute(select(Bid).where(Bid.id == bid_id))
    bid = result.scalar_one_or_none()
    if bid is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found",
        )

    if bid.status == BidStatus.rejected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bid is already rejected",
        )

    if bid.status == BidStatus.selected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject a bid that has already been selected",
        )

    bid.status = BidStatus.rejected
    await db.flush()
    await db.refresh(bid)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="reject_bid",
        entity_type="bid",
        entity_id=str(bid.id),
        payload={"task_id": str(bid.task_id), "agent_id": str(bid.agent_id)},
    )

    resp = BidResponse.model_validate(bid)
    if bid.agent:
        resp.agent_name = bid.agent.name
    return resp
