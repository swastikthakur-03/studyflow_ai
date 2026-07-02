"""
app/schemas/document.py
-----------------------
Pydantic schemas for the Documents API.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    file_name: str
    file_size: int
    page_count: int
    upload_date: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int


class DeleteResponse(BaseModel):
    message: str
    document_id: int
