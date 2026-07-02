"""
app/db/base.py
--------------
Declarative base that all SQLAlchemy ORM models extend.
Importing this file is enough to register all models with Alembic.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass
