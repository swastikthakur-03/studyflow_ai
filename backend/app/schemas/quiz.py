"""app/schemas/quiz.py"""

from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class QuizGenerateRequest(BaseModel):
    document_id: int
    quiz_type: str = "mcq"   # "mcq" | "short_answer"
    count: int = 5
    title: Optional[str] = None


class QuestionItem(BaseModel):
    id: int
    question_text: str
    options: Optional[List[str]]
    correct_answer: str
    explanation: Optional[str]
    user_answer: Optional[str]
    is_correct: Optional[int]
    model_config = {"from_attributes": True}


class QuizResponse(BaseModel):
    id: int
    title: str
    quiz_type: str
    score: Optional[float]
    total_questions: int
    date: datetime
    questions: List[QuestionItem]
    model_config = {"from_attributes": True}


class SubmitAnswerRequest(BaseModel):
    question_id: int
    user_answer: str


class QuizSubmitRequest(BaseModel):
    answers: List[SubmitAnswerRequest]


class QuizHistoryItem(BaseModel):
    id: int
    title: str
    quiz_type: str
    score: Optional[float]
    total_questions: int
    date: datetime
    model_config = {"from_attributes": True}
