"""
app/models/quiz.py
------------------
Quiz + QuizQuestion tables.
One Quiz has many QuizQuestions; each question stores its options,
correct answer, and the user's given answer after submission.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    title       = Column(String(300), nullable=False, default="Quiz")
    quiz_type   = Column(String(20), nullable=False, default="mcq")  # "mcq" | "short_answer"
    score       = Column(Float, nullable=True)          # percentage 0–100 (null until submitted)
    total_questions = Column(Integer, default=0)
    date        = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user      = relationship("User",         back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Quiz id={self.id} score={self.score}>"


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id              = Column(Integer, primary_key=True, index=True)
    quiz_id         = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text   = Column(Text, nullable=False)
    options         = Column(JSON, nullable=True)      # list of strings for MCQ
    correct_answer  = Column(Text, nullable=False)
    user_answer     = Column(Text, nullable=True)      # filled on submission
    explanation     = Column(Text, nullable=True)      # AI-generated explanation
    is_correct      = Column(Integer, nullable=True)   # 1 = correct, 0 = wrong, null = not answered

    # Relationship
    quiz = relationship("Quiz", back_populates="questions")
