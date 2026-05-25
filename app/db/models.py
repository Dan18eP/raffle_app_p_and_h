from datetime import datetime
import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum,
    Boolean,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class TicketStatus(str, enum.Enum):
    ELIGIBLE = "eligible"
    EXCLUDED = "excluded"
    WINNER = "winner"


class RaffleStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    email = Column(String(100), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    tickets = relationship(
        "Ticket",
        back_populates="participant",
        cascade="all, delete-orphan",
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False, index=True)
    ticket_number = Column(String(10), nullable=False, unique=True, index=True)
    status = Column(
        Enum(TicketStatus, name="ticket_status"),
        nullable=False,
        default=TicketStatus.ELIGIBLE,
    )
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    participant = relationship("Participant", back_populates="tickets")


class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, unique=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    raffles = relationship("Raffle", back_populates="artwork")


class Raffle(Base):
    __tablename__ = "raffles"

    id = Column(Integer, primary_key=True, index=True)
    artwork_id = Column(Integer, ForeignKey("artworks.id"), nullable=False, unique=True)
    winner_ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True, unique=True)
    status = Column(
        Enum(RaffleStatus, name="raffle_status"),
        nullable=False,
        default=RaffleStatus.PENDING,
    )
    drawn_at = Column(DateTime, nullable=True)

    artwork = relationship("Artwork", back_populates="raffles")
    winner_ticket = relationship("Ticket")