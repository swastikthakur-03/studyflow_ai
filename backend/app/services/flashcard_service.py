"""
app/services/flashcard_service.py
----------------------------------
Generates flashcards from document text using Groq.
Returns structured JSON that gets saved to the flashcards table.
"""

import json
import re
from typing import List, Dict

from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage

from app.core.config import settings


FLASHCARD_SYSTEM_PROMPT = """You are an expert study assistant that creates effective flashcards.
Generate flashcards that test key concepts, definitions, and important facts.
Each flashcard must have a clear question and a concise, accurate answer.
Always respond with valid JSON only — no preamble, no markdown code fences.
"""


FLASHCARD_HUMAN_TEMPLATE = """Create {count} flashcards from the following study material.

Topic filter: {topic}

Study material:
{text}

Respond with ONLY a JSON array in this exact format:

[
  {{
    "question": "What is...?",
    "answer": "It is..."
  }},
  {{
    "question": "Define...?",
    "answer": "..."
  }}
]
"""


def get_llm():
    return ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model="llama-3.1-8b-instant",
        temperature=0.4,
    )


def generate_flashcards(
    text: str,
    count: int = 10,
    topic: str = "all topics",
) -> List[Dict]:
    """
    Generate flashcards from study material.
    """

    llm = get_llm()

    prompt = FLASHCARD_HUMAN_TEMPLATE.format(
        count=count,
        topic=topic,
        text=text[:8000],
    )

    response = llm.invoke([
        SystemMessage(content=FLASHCARD_SYSTEM_PROMPT),
        HumanMessage(content=prompt),
    ])

    raw = re.sub(r"```json|```", "", response.content.strip()).strip()

    try:
        flashcards = json.loads(raw)

        return [
            {
                "question": fc["question"],
                "answer": fc["answer"],
            }
            for fc in flashcards
            if "question" in fc and "answer" in fc
        ]

    except Exception:
        return []