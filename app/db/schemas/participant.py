# app/db/schemas/participant.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class ParticipantCreate(BaseModel):
    full_name: str
    document_id: Optional[str] = None
    email: Optional[EmailStr] = None


class ParticipantUpdate(BaseModel):
    full_name: Optional[str] = None
    document_id: Optional[str] = None
    email: Optional[EmailStr] = None


class ParticipantOut(BaseModel):
    id: int
    full_name: str
    document_id: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True