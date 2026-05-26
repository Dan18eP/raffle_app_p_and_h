from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db.schemas.ticket import TicketOut


class ParticipantCreate(BaseModel):
    full_name: str


class ParticipantUpdate(BaseModel):
    full_name: Optional[str] = None


class ParticipantOut(BaseModel):
    id: int
    full_name: str
    created_at: datetime
    tickets: List[TicketOut] = []

    class Config:
        from_attributes = True

class ParticipantListOut(BaseModel):
    id: int
    full_name: str
    created_at: datetime
    # We remove the full tickets list for performance in the list view

    class Config:
        from_attributes = True
