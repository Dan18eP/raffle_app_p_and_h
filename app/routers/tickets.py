from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db import models
from app.db.schemas.ticket import TicketCreate, TicketBulkCreate, TicketOut
from app.routers.auth import get_current_admin


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


@router.post("/", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    participant = db.query(models.Participant).filter(
        models.Participant.id == ticket.participant_id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    existing = db.query(models.Ticket).filter(
        models.Ticket.ticket_number == ticket.ticket_number
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Ticket number already exists")

    db_ticket = models.Ticket(
        participant_id=ticket.participant_id,
        ticket_number=ticket.ticket_number,
        status=models.TicketStatus.ELIGIBLE,
    )

    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)

    return db_ticket


@router.post("/bulk", response_model=list[TicketOut], status_code=status.HTTP_201_CREATED)
def create_tickets_bulk(
    payload: TicketBulkCreate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    participant = db.query(models.Participant).filter(
        models.Participant.id == payload.participant_id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    clean_numbers = [n.strip() for n in payload.ticket_numbers if n and n.strip()]
    if not clean_numbers:
        raise HTTPException(status_code=400, detail="No valid ticket numbers provided")

    duplicated_in_request = len(clean_numbers) != len(set(clean_numbers))
    if duplicated_in_request:
        raise HTTPException(status_code=400, detail="Duplicate ticket numbers in request")

    existing_tickets = db.query(models.Ticket).filter(
        models.Ticket.ticket_number.in_(clean_numbers)
    ).all()

    if existing_tickets:
        existing_numbers = [t.ticket_number for t in existing_tickets]
        raise HTTPException(
            status_code=400,
            detail=f"These ticket numbers already exist: {', '.join(existing_numbers)}"
        )

    db_tickets = [
        models.Ticket(
            participant_id=payload.participant_id,
            ticket_number=number,
            status=models.TicketStatus.ELIGIBLE,
        )
        for number in clean_numbers
    ]

    db.add_all(db_tickets)
    db.commit()

    for ticket in db_tickets:
        db.refresh(ticket)

    return db_tickets


@router.get("/", response_model=list[TicketOut])
def get_tickets(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    return db.query(models.Ticket).order_by(models.Ticket.id.asc()).all()


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.status == models.TicketStatus.WINNER:
        raise HTTPException(status_code=400, detail="Winner tickets cannot be deleted")

    db.delete(ticket)
    db.commit()