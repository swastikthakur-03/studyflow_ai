"""app/schemas/chat.py"""

from pydantic import BaseModel
from typing import List, Optional


class ChatMessage(BaseModel):
    role: str        # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str
    document_id: Optional[int] = None
    conversation_history: Optional[List[ChatMessage]] = []


class SourceCitation(BaseModel):
    document_id: int
    page_number: int
    preview: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    has_context: bool
