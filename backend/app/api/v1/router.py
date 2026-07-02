"""
app/api/v1/router.py
--------------------
Central router that includes every feature router.
Adding a new module = one line here.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    documents,
    chat,
    quiz,
    flashcards,
    revision,
    planner,
    dashboard,
)

api_router = APIRouter()

api_router.include_router(auth.router,       prefix="/auth",       tags=["Authentication"])
api_router.include_router(documents.router,  prefix="/documents",  tags=["Documents"])
api_router.include_router(chat.router,       prefix="/chat",       tags=["Chat"])
api_router.include_router(quiz.router,       prefix="/quiz",       tags=["Quiz"])
api_router.include_router(flashcards.router, prefix="/flashcards", tags=["Flashcards"])
api_router.include_router(revision.router,   prefix="/revision",   tags=["Revision"])
api_router.include_router(planner.router,    prefix="/planner",    tags=["Planner"])
api_router.include_router(dashboard.router,  prefix="/dashboard",  tags=["Dashboard"])
