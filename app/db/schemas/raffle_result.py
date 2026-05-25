# app/db/schemas/raffle.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class RaffleStatus(str, Enum):
    PENDING   = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TicketStatus(str, Enum):
    ELIGIBLE = "eligible"
    EXCLUDED = "excluded"
    WINNER   = "winner"


# ─── Ticket Schemas ───────────────────────────────────────────

class TicketCreate(BaseModel):
    participant_id: int
    ticket_number: str


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None


class TicketOut(BaseModel):
    id: int
    raffle_id: int
    participant_id: int
    ticket_number: str
    status: TicketStatus
    assigned_at: datetime

    class Config:
        from_attributes = True


# ─── Raffle Schemas ───────────────────────────────────────────

class RaffleCreate(BaseModel):
    artwork_id: int


class RaffleOut(BaseModel):
    id: int
    artwork_id: int
    status: RaffleStatus
    drawn_at: Optional[datetime] = None
    winner_ticket_id: Optional[int] = None
    is_official: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RaffleResultOut(BaseModel):
    raffle_id: int
    artwork_id: int
    artwork_name: str
    winner_ticket_id: int
    ticket_number: str
    participant_id: int
    participant_name: str
    drawn_at: datetime

    class Config:
        from_attributes = True


# ─── Run Raffle Schema ────────────────────────────────────────

class RunRaffleRequest(BaseModel):
    raffle_id: int
