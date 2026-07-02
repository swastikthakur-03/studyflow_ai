"""
app/core/dependencies.py
------------------------
FastAPI dependency functions injected into route handlers via Depends().
  - get_db        → yields a SQLAlchemy session, auto-closes on exit
  - get_current_user → validates the Bearer token, returns the User ORM object
"""

from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.security import get_user_id_from_token
from app.models.user import User

# Tells FastAPI where clients send the token (used by Swagger UI too)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db() -> Generator[Session, None, None]:
    """
    Yield a database session for the duration of a request.
    The session is always closed in the finally block — even on exceptions.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate the Bearer token and return the corresponding User.
    Raises HTTP 401 if the token is missing, expired, or invalid.
    Raises HTTP 404 if the user no longer exists in the database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = get_user_id_from_token(token)
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user
