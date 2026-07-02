"""
app/db/all_models.py
--------------------
Import every model here so Alembic's autogenerate picks them all up.
This file is imported only by alembic/env.py — not by the app itself.
Keeping it separate avoids circular imports between models and Base.
"""

from app.db.base import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.document_chunk import DocumentChunk  # noqa: F401
from app.models.flashcard import Flashcard  # noqa: F401
from app.models.quiz import Quiz, QuizQuestion  # noqa: F401
from app.models.task import Task  # noqa: F401
