"""
app/models/flashcard.py
-----------------------
Flashcards table — AI-generated question/answer pairs.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class Flashcard(Base):
    __tablename__ = "flashcards"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    question    = Column(Text, nullable=False)
    answer      = Column(Text, nullable=False)
    topic       = Column(String(200), nullable=True)     # optional topic label
    created_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationship
    user = relationship("User", back_populates="flashcards")

    def __repr__(self) -> str:
        return f"<Flashcard id={self.id} user_id={self.user_id}>"
