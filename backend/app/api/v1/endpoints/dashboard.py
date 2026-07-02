"""
app/api/v1/endpoints/dashboard.py
-----------------------------------
Dashboard route:
  GET /dashboard/stats  — aggregated learning statistics
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.flashcard import Flashcard
from app.models.task import Task

router = APIRouter()


class DashboardStats(BaseModel):
    total_documents: int
    total_quizzes: int
    average_quiz_score: Optional[float]
    total_flashcards: int
    pending_tasks: int
    completed_tasks: int
    recent_quizzes: List[dict]
    recent_documents: List[dict]


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = current_user.id

    total_documents = db.query(func.count(Document.id)).filter(Document.user_id == uid).scalar() or 0
    total_quizzes = db.query(func.count(Quiz.id)).filter(Quiz.user_id == uid).scalar() or 0
    total_flashcards = db.query(func.count(Flashcard.id)).filter(Flashcard.user_id == uid).scalar() or 0

    avg_score_result = db.query(func.avg(Quiz.score)).filter(
        Quiz.user_id == uid, Quiz.score != None
    ).scalar()
    average_quiz_score = round(float(avg_score_result), 1) if avg_score_result else None

    pending_tasks = db.query(func.count(Task.id)).filter(
        Task.user_id == uid, Task.status == "pending"
    ).scalar() or 0
    completed_tasks = db.query(func.count(Task.id)).filter(
        Task.user_id == uid, Task.status == "done"
    ).scalar() or 0

    recent_quizzes = db.query(Quiz).filter(Quiz.user_id == uid).order_by(
        Quiz.date.desc()
    ).limit(5).all()

    recent_documents = db.query(Document).filter(Document.user_id == uid).order_by(
        Document.upload_date.desc()
    ).limit(5).all()

    return DashboardStats(
        total_documents=total_documents,
        total_quizzes=total_quizzes,
        average_quiz_score=average_quiz_score,
        total_flashcards=total_flashcards,
        pending_tasks=pending_tasks,
        completed_tasks=completed_tasks,
        recent_quizzes=[
            {"id": q.id, "title": q.title, "score": q.score, "date": q.date.isoformat()}
            for q in recent_quizzes
        ],
        recent_documents=[
            {"id": d.id, "file_name": d.file_name, "upload_date": d.upload_date.isoformat()}
            for d in recent_documents
        ],
    )
