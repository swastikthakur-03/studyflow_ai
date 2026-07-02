"""
app/utils/embeddings.py
-----------------------
Manages the ChromaDB client and all vector operations:
  - Store chunks as embeddings
  - Semantic search (retrieve top-k similar chunks)
  - Delete a document's vectors

Uses sentence-transformers locally for embedding generation
(no external API call needed — runs on CPU fine for this scale).
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Optional
import uuid

from app.core.config import settings

# ── Lazy singletons ──────────────────────────────────────────
_chroma_client = None
_embedding_model = None


def get_chroma_client():
    
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
        )
    return _chroma_client


def get_embedding_model() -> SentenceTransformer:
    """Return (or load) the sentence-transformer model."""
    global _embedding_model
    if _embedding_model is None:
        # Downloads on first run (~90MB), cached locally after
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def get_or_create_collection(user_id: int) -> chromadb.Collection:
    """
    Each user gets their own ChromaDB collection so searches
    are naturally scoped to that user's documents.
    """
    client = get_chroma_client()
    collection_name = f"user_{user_id}_docs"
    return client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},  # cosine similarity for text
    )


def embed_chunks(
    user_id: int,
    document_id: int,
    chunks: List[Dict],
) -> List[str]:
    """
    Embed a list of text chunks and store them in ChromaDB.

    Args:
        user_id:     owner — determines which collection to use
        document_id: used as metadata for filtering / deletion
        chunks:      [{"chunk_index": 0, "page_number": 1, "text": "..."}]

    Returns:
        List of embedding IDs (one per chunk) to store in PostgreSQL.
    """
    if not chunks:
        return []

    model = get_embedding_model()
    collection = get_or_create_collection(user_id)

    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=False).tolist()

    # Generate stable unique IDs for each chunk
    ids = [str(uuid.uuid4()) for _ in chunks]

    metadatas = [
        {
            "document_id": str(document_id),
            "page_number": str(c["page_number"]),
            "chunk_index": str(c["chunk_index"]),
        }
        for c in chunks
    ]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )

    return ids


def semantic_search(
    user_id: int,
    query: str,
    top_k: int = 5,
    document_id: Optional[int] = None,
) -> List[Dict]:
    """
    Find the top-k most relevant chunks for a query.

    Args:
        user_id:     scopes search to this user's collection
        query:       the question / search string
        top_k:       number of results to return
        document_id: if set, only search within this document

    Returns:
        [{"text": "...", "document_id": 1, "page_number": 2, "score": 0.87}, ...]
    """
    model = get_embedding_model()
    collection = get_or_create_collection(user_id)

    query_embedding = model.encode([query], show_progress_bar=False).tolist()

    # Build optional filter
    where = None
    if document_id is not None:
        where = {"document_id": str(document_id)}

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(top_k, collection.count() or 1),
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for i, doc_text in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        distance = results["distances"][0][i]
        # Convert cosine distance → similarity score (1 = identical)
        score = round(1 - distance, 4)
        chunks.append({
            "text": doc_text,
            "document_id": int(meta.get("document_id", 0)),
            "page_number": int(meta.get("page_number", 1)),
            "chunk_index": int(meta.get("chunk_index", 0)),
            "score": score,
        })

    return chunks


def delete_document_embeddings(user_id: int, document_id: int) -> None:
    """Remove all vectors belonging to a document from ChromaDB."""
    collection = get_or_create_collection(user_id)
    results = collection.get(where={"document_id": str(document_id)})
    if results["ids"]:
        collection.delete(ids=results["ids"])
