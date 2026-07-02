"""
app/db/session.py
-----------------
Creates the SQLAlchemy engine and session factory.
Import SessionLocal wherever you need a DB session.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# connect_args is only needed for SQLite; fine to leave empty for PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # test connections before using them (avoids stale conn errors)
    pool_size=10,             # number of persistent connections in the pool
    max_overflow=20,          # extra connections allowed beyond pool_size under load
    echo=settings.DEBUG,      # log SQL queries in development
)

# Each request gets its own session via Depends(get_db)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
