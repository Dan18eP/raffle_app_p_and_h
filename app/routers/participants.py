from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from typing import List

from app.db.database import get_db
from app.db import models
from app.db.schemas.participant import (
    ParticipantCreate,
    ParticipantOut,
    ParticipantUpdate,
)

import shutil
import os
import uuid

router = APIRouter(
    prefix="/participants",
    tags=["Participants"]
)


# CREATE
@router.post("/", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED)
def create_participant(
    participant: ParticipantCreate,
    db: Session = Depends(get_db)
):
    try:
        db_participant = models.Participant(**participant.model_dump())
        db.add(db_participant)
        db.commit()
        db.refresh(db_participant)
        return db_participant
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Participant with the same full_name already exists"
        )


# CREATE BULK
@router.post("/bulk", response_model=list[ParticipantOut], status_code=status.HTTP_201_CREATED)
def create_participants_bulk(
    participants: List[ParticipantCreate],
    db: Session = Depends(get_db)
):
    try:
        db_participants = [models.Participant(**part.model_dump()) for part in participants]
        db.add_all(db_participants)
        db.commit()

        for part in db_participants:
            db.refresh(part)

        return db_participants
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="One or more participants have duplicate full_name"
        )


# INSERT FROM FILE
@router.post("/upload", response_model=dict)
def upload_participants_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    from app.services.csv_loader import load_participants_from_file

    if not file.filename.endswith((".csv", ".xls", ".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV or Excel files are allowed"
        )

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)

    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(temp_dir, temp_filename)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = load_participants_from_file(temp_path, db)

    os.remove(temp_path)

    return result


# COUNT PARTICIPANTS
@router.get("/count")
def get_participants_count(db: Session = Depends(get_db)):
    return {"count": db.query(models.Participant).count()}


# READ ALL (PAGINATED)
@router.get("/", response_model=list[ParticipantOut])
def get_participants(
    skip: int = 0, 
    limit: int = 100, # Reduced limit for significantly faster loading
    db: Session = Depends(get_db)
):
    return db.query(models.Participant).offset(skip).limit(limit).all()


# READ ONE
@router.get("/{participant_id}", response_model=ParticipantOut)
def get_participant(participant_id: int, db: Session = Depends(get_db)):
    participant = db.query(models.Participant).filter(
        models.Participant.id == participant_id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    return participant


# UPDATE
@router.put("/{participant_id}", response_model=ParticipantOut)
def update_participant(
    participant_id: int,
    participant_data: ParticipantUpdate,
    db: Session = Depends(get_db)
):
    participant = db.query(models.Participant).filter(
        models.Participant.id == participant_id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    try:
        for key, value in participant_data.model_dump(exclude_unset=True).items():
            setattr(participant, key, value)

        db.commit()
        db.refresh(participant)
        return participant
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Another participant already uses that full_name"
        )


# DELETE
@router.delete("/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_participant(participant_id: int, db: Session = Depends(get_db)):
    participant = db.query(models.Participant).filter(
        models.Participant.id == participant_id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    # Force delete raffle associations if this participant has winners
    # This allows cleaning up data during testing phase
    ticket_ids = [t.id for t in participant.tickets]
    if ticket_ids:
        db.query(models.Raffle).filter(
            models.Raffle.winner_ticket_id.in_(ticket_ids)
        ).delete(synchronize_session=False)

    db.delete(participant)
    db.commit()


    # RESET ALL (TESTING ONLY)
    @router.delete("/reset/all", status_code=status.HTTP_204_NO_CONTENT)
    def reset_participants(db: Session = Depends(get_db)):
        # Truncate participants will also clear tickets and raffles due to CASCADE
        db.execute(text("TRUNCATE TABLE participants RESTART IDENTITY CASCADE"))
        db.commit()