"""
app/services/quiz_service.py
-----------------------------
Generates MCQ and short-answer quizzes using Groq.
Also handles auto-grading of submitted answers.
"""

import json
import re
from typing import List, Dict

from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage

from app.core.config import settings


QUIZ_SYSTEM = """You are an expert educator creating exam-quality quiz questions.
Always respond with valid JSON only — no preamble, no markdown code fences."""


MCQ_TEMPLATE = """Create {count} multiple choice questions from this study material.

Study material:
{text}

Respond with ONLY a JSON array:
[
  {{
    "question": "Question text?",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct_answer": "A) option1",
    "explanation": "Brief explanation why this is correct"
  }}
]
"""


SHORT_ANSWER_TEMPLATE = """Create {count} short-answer questions from this study material.

Study material:
{text}

Respond with ONLY a JSON array:
[
  {{
    "question": "Explain...",
    "correct_answer": "Model answer here",
    "explanation": "Key points that should be covered"
  }}
]
"""


GRADING_TEMPLATE = """Grade this short-answer response.

Question: {question}
Model answer: {correct_answer}
Student answer: {student_answer}

Respond with ONLY JSON:
{{"is_correct": true, "score": 0.8, "feedback": "brief feedback"}}
"""


def get_llm():
    return ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model="llama-3.1-8b-instant",
        temperature=0.3,
    )


def generate_quiz(text: str, quiz_type: str = "mcq", count: int = 5) -> List[Dict]:
    llm = get_llm()

    template = MCQ_TEMPLATE if quiz_type == "mcq" else SHORT_ANSWER_TEMPLATE
    prompt = template.format(count=count, text=text[:8000])

    response = llm.invoke([
        SystemMessage(content=QUIZ_SYSTEM),
        HumanMessage(content=prompt),
    ])

    raw = re.sub(r"```json|```", "", response.content.strip()).strip()

    try:
        return json.loads(raw)
    except Exception:
        return []


def grade_short_answer(
    question: str,
    correct_answer: str,
    student_answer: str,
) -> Dict:
    llm = get_llm()

    prompt = GRADING_TEMPLATE.format(
        question=question,
        correct_answer=correct_answer,
        student_answer=student_answer,
    )

    response = llm.invoke([
        HumanMessage(content=prompt)
    ])

    raw = re.sub(r"```json|```", "", response.content.strip()).strip()

    try:
        return json.loads(raw)
    except Exception:
        return {
            "is_correct": False,
            "score": 0,
            "feedback": "Could not grade automatically",
        }