"""
app/api/v1/endpoints/flashcards.py
------------------------------------
Flashcard routes:
  POST /flashcards/generate  — AI generates cards from a document
  GET  /flashcards           — list all saved flashcards
  DELETE /flashcards/{id}    — delete a flashcard
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.flashcard import Flashcard
from app.schemas.flashcard import (
    FlashcardGenerateRequest, FlashcardItem, FlashcardListResponse
)
from app.services.flashcard_service import generate_flashcards

router = APIRouter()


@router.post("/generate", response_model=FlashcardListResponse, status_code=201)
def generate(
    payload: FlashcardGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate flashcards from a document and save them."""
    doc = db.query(Document).filter(
        Document.id == payload.document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Pull the document's text from stored chunks
    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == payload.document_id
    ).order_by(DocumentChunk.chunk_index).all()

    if not chunks:
        raise HTTPException(status_code=400, detail="Document has no extractable text")

    combined_text = " ".join(c.chunk_text for c in chunks[:30])  # first 30 chunks

    generated = generate_flashcards(
        text=combined_text,
        count=payload.count,
        topic=payload.topic or "all topics",
    )

    if not generated:
        raise HTTPException(status_code=500, detail="Failed to generate flashcards")

    saved = []
    for fc in generated:
        card = Flashcard(
            user_id=current_user.id,
            document_id=payload.document_id,
            question=fc["question"],
            answer=fc["answer"],
            topic=payload.topic,
        )
        db.add(card)
        db.flush()
        saved.append(card)

    db.commit()
    for card in saved:
        db.refresh(card)

    return FlashcardListResponse(
        flashcards=[FlashcardItem.model_validate(c) for c in saved],
        total=len(saved),
    )


@router.get("", response_model=FlashcardListResponse)
def list_flashcards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cards = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id
    ).order_by(Flashcard.created_at.desc()).all()
    return FlashcardListResponse(
        flashcards=[FlashcardItem.model_validate(c) for c in cards],
        total=len(cards),
    )


@router.delete("/{flashcard_id}")
def delete_flashcard(
    flashcard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == current_user.id,
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    db.delete(card)
    db.commit()
    return {"message": "Deleted", "id": flashcard_id}
