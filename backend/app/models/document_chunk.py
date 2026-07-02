"""
app/models/document_chunk.py
-----------------------------
DocumentChunks table — stores the text chunks extracted from PDFs.
Each chunk has an embedding_id that maps to a vector in ChromaDB.
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id           = Column(Integer, primary_key=True, index=True)
    document_id  = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_text   = Column(Text, nullable=False)
    chunk_index  = Column(Integer, nullable=False)   # position within the document (0-based)
    page_number  = Column(Integer, default=1)        # source page for citation display
    embedding_id = Column(String(100), nullable=True, index=True)  # ChromaDB vector ID

    # Relationship
    document = relationship("Document", back_populates="chunks")

    def __repr__(self) -> str:
        return f"<DocumentChunk id={self.id} doc_id={self.document_id} page={self.page_number}>"
