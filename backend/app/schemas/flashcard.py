"""app/schemas/flashcard.py"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class FlashcardGenerateRequest(BaseModel):
    document_id: int
    count: int = 10
    topic: Optional[str] = "all topics"


class FlashcardItem(BaseModel):
    id: int
    question: str
    answer: str
    topic: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class FlashcardListResponse(BaseModel):
    flashcards: List[FlashcardItem]
    total: int
