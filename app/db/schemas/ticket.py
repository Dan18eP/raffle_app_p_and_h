from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class TicketStatus(str, Enum):
    ELIGIBLE = "eligible"
    EXCLUDED = "excluded"
    WINNER = "winner"


class TicketCreate(BaseModel):
    participant_id: int = Field(..., gt=0)
    raffle_id: int = Field(..., gt=0)
    ticket_number: str = Field(..., min_length=1, max_length=10)


class TicketBulkCreate(BaseModel):
    participant_id: int = Field(..., gt=0)
    raffle_id: int = Field(..., gt=0)
    ticket_numbers: List[str] = Field(..., min_length=1)


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None


class TicketOut(BaseModel):
    id: int
    participant_id: int
    raffle_id: int
    ticket_number: str
    status: TicketStatus
    assigned_at: datetime

    class Config:
        from_attributes = True