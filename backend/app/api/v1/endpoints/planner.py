"""
app/api/v1/endpoints/planner.py
---------------------------------
Study planner routes:
  POST /planner/generate   — AI generates a study schedule
  GET  /planner/tasks      — list all tasks
  POST /planner/tasks      — create a task manually
  PATCH /planner/tasks/{id} — update task status
  DELETE /planner/tasks/{id}— delete task
"""

import json
import re
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from langchain_groq import ChatGroq
from langchain.schema import HumanMessage

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.task import Task

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────

class TaskResponse(BaseModel):
    id: int
    title: str
    subject: str
    priority: str
    deadline: datetime
    duration: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PlannerGenerateRequest(BaseModel):
    subjects: List[str]
    deadline: str
    daily_hours: float = 3.0
    priority: str = "medium"


class CreateTaskRequest(BaseModel):
    title: str
    subject: str
    priority: str = "medium"
    deadline: str
    duration: float = 1.0


class UpdateTaskRequest(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None


# ── Helper ────────────────────────────────────────────────────

def get_llm():
    return ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model="llama-3.1-8b-instant",
        temperature=0.3,
    )


# ── Endpoints ─────────────────────────────────────────────────

@router.post("/generate", response_model=List[TaskResponse], status_code=201)
def generate_schedule(
    payload: PlannerGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI generates a complete study schedule and saves tasks."""

    llm = get_llm()

    prompt = f"""Create a study schedule for these subjects: {', '.join(payload.subjects)}
Deadline: {payload.deadline}
Daily study hours available: {payload.daily_hours}
Priority level: {payload.priority}

Generate a list of study tasks spread across the available time.

Respond ONLY with a JSON array:

[
  {{
    "title": "Study Chapter 1 — Introduction",
    "subject": "subject name",
    "priority": "high",
    "deadline": "2026-12-20T18:00:00",
    "duration": 1.5
  }}
]
"""

    response = llm.invoke([
        HumanMessage(content=prompt)
    ])

    raw = re.sub(r"```json|```", "", response.content.strip()).strip()

    try:
        tasks_data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate study schedule."
        )

    saved_tasks = []

    for t in tasks_data:

        try:
            deadline_dt = datetime.fromisoformat(
                t["deadline"].replace("Z", "+00:00")
            )
        except Exception:
            deadline_dt = datetime.now(timezone.utc)

        task = Task(
            user_id=current_user.id,
            title=t.get("title", "Study Task"),
            subject=t.get("subject", "General"),
            priority=t.get("priority", "medium"),
            deadline=deadline_dt,
            duration=float(t.get("duration", 1.0)),
            status="pending",
        )

        db.add(task)
        saved_tasks.append(task)

    db.commit()

    for task in saved_tasks:
        db.refresh(task)

    return [TaskResponse.model_validate(task) for task in saved_tasks]


@router.get("/tasks", response_model=List[TaskResponse])
def get_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id)
        .order_by(Task.deadline.asc())
        .all()
    )

    return [TaskResponse.model_validate(task) for task in tasks]


@router.post("/tasks", response_model=TaskResponse, status_code=201)
def create_task(
    payload: CreateTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    try:
        deadline_dt = datetime.fromisoformat(
            payload.deadline.replace("Z", "+00:00")
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid deadline format."
        )

    task = Task(
        user_id=current_user.id,
        title=payload.title,
        subject=payload.subject,
        priority=payload.priority,
        deadline=deadline_dt,
        duration=payload.duration,
        status="pending",
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return TaskResponse.model_validate(task)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: UpdateTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    task = (
        db.query(Task)
        .filter(
            Task.id == task_id,
            Task.user_id == current_user.id,
        )
        .first()
    )

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.status:
        task.status = payload.status

    if payload.priority:
        task.priority = payload.priority

    db.commit()
    db.refresh(task)

    return TaskResponse.model_validate(task)


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    task = (
        db.query(Task)
        .filter(
            Task.id == task_id,
            Task.user_id == current_user.id,
        )
        .first()
    )

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {
        "message": "Deleted",
        "id": task_id,
    }