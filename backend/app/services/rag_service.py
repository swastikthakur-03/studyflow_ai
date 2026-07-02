"""
app/services/rag_service.py
---------------------------
The core RAG (Retrieval Augmented Generation) pipeline.

Flow:
  User question
    → semantic_search(ChromaDB)
    → build prompt with retrieved context
    → Groq Llama generates answer
    → return answer + source citations
"""

from typing import List, Dict, Optional

from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage

from app.core.config import settings
from app.utils.embeddings import semantic_search


# ──────────────────────────────────────────────────────────────
# System Prompt
# ──────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are StudyFlow AI, an intelligent study assistant.

Answer ONLY from the provided study material.

Rules:
1. Use only the supplied context.
2. If the answer is not present, clearly say that it isn't available in the uploaded notes.
3. Keep answers educational and structured.
4. Use bullet points whenever appropriate.
5. Never hallucinate information.
"""


HUMAN_PROMPT_TEMPLATE = """
Context from study notes:

{context}


Student Question:
{question}

Answer:
"""


# ──────────────────────────────────────────────────────────────
# LLM
# ──────────────────────────────────────────────────────────────

def get_llm() -> ChatGroq:
    """Create the Groq LLM."""

    return ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model="llama-3.1-8b-instant",
        temperature=0.3,
        max_tokens=1024,
    )


# ──────────────────────────────────────────────────────────────
# RAG Pipeline
# ──────────────────────────────────────────────────────────────

def answer_question(
    user_id: int,
    question: str,
    document_id: Optional[int] = None,
    conversation_history: Optional[List[Dict]] = None,
) -> Dict:
    """
    Retrieve relevant chunks from ChromaDB,
    send them to Groq,
    return answer + citations.
    """

    # ----------------------------------------------------------
    # Retrieve relevant chunks
    # ----------------------------------------------------------

    chunks = semantic_search(
        user_id=user_id,
        query=question,
        top_k=5,
        document_id=document_id,
    )

    if len(chunks) == 0:
        return {
            "answer": (
                "I couldn't find any relevant information "
                "inside your uploaded notes."
            ),
            "sources": [],
            "has_context": False,
        }

    # ----------------------------------------------------------
    # Build Context
    # ----------------------------------------------------------

    context_parts = []

    for i, chunk in enumerate(chunks, start=1):
        context_parts.append(
            f"[Source {i} | Page {chunk['page_number']}]\n{chunk['text']}"
        )

    context = "\n\n".join(context_parts)

    # ----------------------------------------------------------
    # Prompt
    # ----------------------------------------------------------

    human_prompt = HUMAN_PROMPT_TEMPLATE.format(
        context=context,
        question=question,
    )

    # ----------------------------------------------------------
    # LLM Call
    # ----------------------------------------------------------

    llm = get_llm()

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=human_prompt),
    ]

    response = llm.invoke(messages)

    answer = response.content

    # ----------------------------------------------------------
    # Source Citations
    # ----------------------------------------------------------

    seen = set()
    sources = []

    for chunk in chunks:

        key = (
            chunk["document_id"],
            chunk["page_number"],
        )

        if key in seen:
            continue

        seen.add(key)

        sources.append(
            {
                "document_id": chunk["document_id"],
                "page_number": chunk["page_number"],
                "preview": chunk["text"][:150] + "...",
                "score": chunk["score"],
            }
        )

    return {
        "answer": answer,
        "sources": sources,
        "has_context": True,
    }