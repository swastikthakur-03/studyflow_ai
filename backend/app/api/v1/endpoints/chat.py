"""
app/api/v1/endpoints/chat.py
-----------------------------
RAG chat routes:
  POST /chat/message — send question, get AI answer with citations
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import answer_question

router = APIRouter()


@router.post("/message", response_model=ChatResponse, summary="Ask a question from your notes")
def chat_message(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a question and receive an AI-generated answer with source citations.
    Optionally scope to a specific document with document_id.
    """
    # Verify document belongs to user if specified
    if payload.document_id:
        doc = db.query(Document).filter(
            Document.id == payload.document_id,
            Document.user_id == current_user.id,
        ).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    history = [m.model_dump() for m in (payload.conversation_history or [])]

    try:
        result = answer_question(
            user_id=current_user.id,
            question=payload.question,
            document_id=payload.document_id,
            conversation_history=history,
        )
        return ChatResponse(**result)