# Database models
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base

#Define the Admin model
class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

#Define the Participant model
class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    document_id = Column(String(50), unique=True, nullable=False)
    tickets = Column(Integer, default=0)
    email = Column(String(150), unique=True, nullable=True)

    raffle_results = relationship("RaffleResult", back_populates="participant")

#Define the Artwork model
class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    artist = Column(String(150), nullable=False)
    image_url = Column(String(500), nullable=True) 
    

    raffle_results = relationship("RaffleResult", back_populates="artwork")

#Define the RaffleResult model
class RaffleResult(Base):
    __tablename__ = "raffle_results"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"))
    artwork_id = Column(Integer, ForeignKey("artworks.id"))
    won_at = Column(DateTime, default=datetime.utcnow)

    participant = relationship("Participant", back_populates="raffle_results")
    artwork = relationship("Artwork", back_populates="raffle_results")
