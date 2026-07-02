"""
app/api/v1/endpoints/quiz.py
-----------------------------
Quiz routes:
  POST /quiz/generate       — generate a new quiz from a document
  GET  /quiz/{id}           — get quiz with questions
  POST /quiz/{id}/submit    — submit answers, get score + explanations
  GET  /quiz/history        — past quiz results
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.quiz import Quiz, QuizQuestion
from app.schemas.quiz import (
    QuizGenerateRequest, QuizResponse, QuizSubmitRequest,
    QuizHistoryItem, QuestionItem
)
from app.services.quiz_service import generate_quiz, grade_short_answer

router = APIRouter()


@router.post("/generate", response_model=QuizResponse, status_code=201)
def generate(
    payload: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(
        Document.id == payload.document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == payload.document_id
    ).order_by(DocumentChunk.chunk_index).limit(30).all()

    if not chunks:
        raise HTTPException(status_code=400, detail="Document has no text")

    combined_text = " ".join(c.chunk_text for c in chunks)
    questions_data = generate_quiz(combined_text, payload.quiz_type, payload.count)

    if not questions_data:
        raise HTTPException(status_code=500, detail="Failed to generate quiz")

    title = payload.title or f"Quiz — {doc.file_name}"
    quiz = Quiz(
        user_id=current_user.id,
        document_id=payload.document_id,
        title=title,
        quiz_type=payload.quiz_type,
        total_questions=len(questions_data),
    )
    db.add(quiz)
    db.flush()

    question_objs = []
    for q in questions_data:
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q.get("question", ""),
            options=q.get("options"),
            correct_answer=q.get("correct_answer", ""),
            explanation=q.get("explanation"),
        )
        db.add(qq)
        question_objs.append(qq)

    db.commit()
    db.refresh(quiz)
    for q in question_objs:
        db.refresh(q)

    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        quiz_type=quiz.quiz_type,
        score=quiz.score,
        total_questions=quiz.total_questions,
        date=quiz.date,
        questions=[QuestionItem.model_validate(q) for q in question_objs],
    )


@router.get("/history", response_model=list[QuizHistoryItem])
def quiz_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quizzes = db.query(Quiz).filter(
        Quiz.user_id == current_user.id
    ).order_by(Quiz.date.desc()).all()
    return [QuizHistoryItem.model_validate(q) for q in quizzes]


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id, Quiz.user_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    return QuizResponse(
        id=quiz.id, title=quiz.title, quiz_type=quiz.quiz_type,
        score=quiz.score, total_questions=quiz.total_questions, date=quiz.date,
        questions=[QuestionItem.model_validate(q) for q in questions],
    )


@router.post("/{quiz_id}/submit", response_model=QuizResponse)
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id, Quiz.user_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    answer_map = {a.question_id: a.user_answer for a in payload.answers}

    correct_count = 0
    for q in questions:
        user_ans = answer_map.get(q.id, "")
        q.user_answer = user_ans

        if quiz.quiz_type == "mcq":
            is_correct = 1 if user_ans.strip() == q.correct_answer.strip() else 0
        else:
            result = grade_short_answer(q.question_text, q.correct_answer, user_ans)
            is_correct = 1 if result.get("is_correct") else 0

        q.is_correct = is_correct
        if is_correct:
            correct_count += 1

    quiz.score = round((correct_count / len(questions)) * 100, 1) if questions else 0
    db.commit()
    db.refresh(quiz)

    return QuizResponse(
        id=quiz.id, title=quiz.title, quiz_type=quiz.quiz_type,
        score=quiz.score, total_questions=quiz.total_questions, date=quiz.date,
        questions=[QuestionItem.model_validate(q) for q in questions],
    )
