# app/db/schemas/participant.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ParticipantCreate(BaseModel):
    full_name: str


class ParticipantUpdate(BaseModel):
    full_name: Optional[str] = None


class ParticipantOut(BaseModel):
    id: int
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True
