from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from db import models
from db.schemas.participant import (
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

#CREATE
@router.post("/", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED)
def create_participant(
    participant: ParticipantCreate,
    db: Session = Depends(get_db)
):
    db_participant = models.Participant(**participant.model_dump())
    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)
    return db_participant

#CREATE BULK
@router.post("/bulk", response_model=list[ParticipantOut], status_code=status.HTTP_201_CREATED)
def create_participants_bulk(participants: List[ParticipantCreate], db: Session = Depends(get_db)):

    db_participants = [models.Participant(**part.model_dump()) for part in participants]

    db.add_all(db_participants)
    db.commit()

    for part in db_participants:
        db.refresh(part)

    return db_participants

#INSERT FROM FILE
@router.post("/upload", response_model=dict)
def upload_participants_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    from services.csv_loader import load_participants_from_file

    #Validations and saving file temporarily
    if not file.filename.endswith((".csv", ".xls", ".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV or Excel files are allowed"
        )

    #Saving file temporarily
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)

    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(temp_dir, temp_filename)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    #Processing file
    result = load_participants_from_file(temp_path, db)

    #Cleaning up
    os.remove(temp_path)

    return result



#READ ALL
@router.get("/", response_model=list[ParticipantOut])
def get_participants(db: Session = Depends(get_db)):
    return db.query(models.Participant).all()


#READ ONE
@router.get("/{participant_id}", response_model=ParticipantOut)
def get_participant(participant_id: int, db: Session = Depends(get_db)):
    participant = db.query(models.Participant).filter(
        models.Participant.id == participant_id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    return participant


#UPDATE
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

    for key, value in participant_data.model_dump(exclude_unset=True).items():
        setattr(participant, key, value)

    db.commit()
    db.refresh(participant)
    return participant


#DELETE
@router.delete("/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_participant(participant_id: int, db: Session = Depends(get_db)):
    participant = db.query(models.Participant).filter(
        models.Participant.id == participant_id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    db.delete(participant)
    db.commit()
