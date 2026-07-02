"""
app/api/v1/endpoints/revision.py
----------------------------------
Revision assistant routes:
  POST /revision/generate  — generate summaries, formulas, key concepts, exam notes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.document_chunk import DocumentChunk

router = APIRouter()

REVISION_PROMPTS = {
    "summary": "Create a comprehensive chapter summary with main topics, key arguments, and conclusions.",
    "formulas": "Extract all mathematical formulas, equations, and scientific laws. Format each with name and description.",
    "key_concepts": "List the 10-15 most important concepts, terms, and definitions. Format as term: definition.",
    "exam_notes": "Create concise exam-focused revision notes highlighting the most testable facts, common questions, and critical points.",
}


class RevisionRequest(BaseModel):
    document_id: int
    revision_type: str = "summary"


class RevisionResponse(BaseModel):
    revision_type: str
    content: str
    document_name: str


def get_llm():
    return ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model="llama-3.1-8b-instant",
        temperature=0.3,
    )


@router.post("/generate", response_model=RevisionResponse)
def generate_revision(
    payload: RevisionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.revision_type not in REVISION_PROMPTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid type. Choose: {list(REVISION_PROMPTS.keys())}",
        )

    doc = (
        db.query(Document)
        .filter(
            Document.id == payload.document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == payload.document_id)
        .order_by(DocumentChunk.chunk_index)
        .limit(40)
        .all()
    )

    if not chunks:
        raise HTTPException(status_code=400, detail="Document has no text")

    text = " ".join(chunk.chunk_text for chunk in chunks)[:10000]

    llm = get_llm()

    instruction = REVISION_PROMPTS[payload.revision_type]

    prompt = f"""{instruction}

Study material:

{text}
"""

    response = llm.invoke([
        SystemMessage(
            content="You are an expert study assistant. Be clear, structured, and thorough."
        ),
        HumanMessage(content=prompt),
    ])

    return RevisionResponse(
        revision_type=payload.revision_type,
        content=response.content,
        document_name=doc.file_name,
    )