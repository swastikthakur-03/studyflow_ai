"""
app/api/v1/endpoints/documents.py
----------------------------------
PDF document management routes:
  POST   /documents/upload     — upload a PDF, extract text, embed chunks
  GET    /documents            — list all user's documents
  GET    /documents/{id}       — get single document metadata
  DELETE /documents/{id}       — delete document + vectors + file
"""

import os
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.schemas.document import DocumentResponse, DocumentListResponse, DeleteResponse
from app.utils.pdf_extractor import extract_text_from_pdf, get_page_count, chunk_pages
from app.utils.embeddings import embed_chunks, delete_document_embeddings

router = APIRouter()


# ── POST /documents/upload ────────────────────────────────────
@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF and trigger RAG pipeline",
)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Full upload pipeline:
    1. Validate file type + size
    2. Save PDF to disk
    3. Extract text with PyMuPDF
    4. Chunk text (500 words, 50 overlap)
    5. Generate embeddings with sentence-transformers
    6. Store vectors in ChromaDB
    7. Save chunk metadata to PostgreSQL
    """
    # 1. Validate
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB",
        )

    # 2. Save to disk with a unique filename to avoid collisions
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        # 3. Extract text page by page
        pages = extract_text_from_pdf(file_path)
        page_count = get_page_count(file_path)

        # 4. Chunk all pages into overlapping segments
        chunks = chunk_pages(pages, chunk_size=500, overlap=50)

        # 5. Create the Document row first (we need its ID for chunks)
        document = Document(
            user_id=current_user.id,
            file_name=file.filename,
            file_path=file_path,
            file_size=len(content),
            page_count=page_count,
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        # 6. Embed and store in ChromaDB (skip if no extractable text)
        embedding_ids = []
        if chunks:
            embedding_ids = embed_chunks(
                user_id=current_user.id,
                document_id=document.id,
                chunks=chunks,
            )

        # 7. Save chunk metadata to PostgreSQL
        for i, chunk in enumerate(chunks):
            db_chunk = DocumentChunk(
                document_id=document.id,
                chunk_text=chunk["text"],
                chunk_index=chunk["chunk_index"],
                page_number=chunk["page_number"],
                embedding_id=embedding_ids[i] if i < len(embedding_ids) else None,
            )
            db.add(db_chunk)

        db.commit()
        return DocumentResponse.model_validate(document)

    except Exception as e:
        # Clean up the saved file if anything goes wrong
        if os.path.exists(file_path):
            os.remove(file_path)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ── GET /documents ────────────────────────────────────────────
@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List all documents for the current user",
)
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.upload_date.desc())
        .all()
    )
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in docs],
        total=len(docs),
    )


# ── GET /documents/{id} ───────────────────────────────────────
@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get a single document",
)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(doc)


# ── DELETE /documents/{id} ────────────────────────────────────
@router.delete(
    "/{document_id}",
    response_model=DeleteResponse,
    summary="Delete a document and all its data",
)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # 1. Remove vectors from ChromaDB
    try:
        delete_document_embeddings(current_user.id, document_id)
    except Exception:
        pass  # don't block deletion if Chroma is temporarily unavailable

    # 2. Delete the physical file
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    # 3. Delete DB rows (chunks cascade automatically)
    db.delete(doc)
    db.commit()

    return DeleteResponse(message="Document deleted successfully", document_id=document_id)
