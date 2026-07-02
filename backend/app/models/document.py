"""
app/models/document.py
----------------------
Documents table — metadata for each uploaded PDF.
The actual file lives on disk; this row points to it.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship

from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name   = Column(String(255), nullable=False)       # original filename shown in UI
    file_path   = Column(String(500), nullable=False)       # path on disk / storage key
    file_size   = Column(BigInteger, default=0)             # bytes
    page_count  = Column(Integer, default=0)
    upload_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user   = relationship("User",          back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Document id={self.id} file_name={self.file_name}>"
