"""
app/models/task.py
------------------
Tasks table — study planner tasks with priority and deadline tracking.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship

from app.db.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title      = Column(String(300), nullable=False)
    subject    = Column(String(200), nullable=False)
    priority   = Column(String(10),  nullable=False, default="medium")  # "high" | "medium" | "low"
    deadline   = Column(DateTime(timezone=True), nullable=False)
    duration   = Column(Float, nullable=False, default=1.0)  # estimated hours
    status     = Column(String(20),  nullable=False, default="pending")  # "pending" | "done" | "missed"
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationship
    user = relationship("User", back_populates="tasks")

    def __repr__(self) -> str:
        return f"<Task id={self.id} title={self.title} status={self.status}>"
