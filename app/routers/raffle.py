# app/routers/raffle.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text

from app.db.database import get_db
from app.db import models
from app.db.models import Raffle, RaffleStatus, Ticket, TicketStatus
from app.services.raffle import run_raffle, run_raffle_single
from app.routers.auth import get_current_admin

router = APIRouter(
    prefix="/raffle",
    tags=["Raffle"]
)


@router.post("/test", status_code=status.HTTP_200_OK)
def run_raffle_test_endpoint(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    already_run = db.query(Raffle).filter(Raffle.status == RaffleStatus.COMPLETED).first()
    if already_run:
        raise HTTPException(status_code=409, detail="Raffle has already been executed")
    result = run_raffle(db)
    if "detail" in result:
        raise HTTPException(status_code=400, detail=result["detail"])
    return result


@router.get("/next", status_code=status.HTTP_200_OK)
def get_next_artwork(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    awarded_ids = {r.artwork_id for r in db.query(Raffle.artwork_id).filter(Raffle.status == RaffleStatus.COMPLETED).all()}
    artwork = db.query(models.Artwork).filter(models.Artwork.id.notin_(awarded_ids) if awarded_ids else True).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="No artworks available for raffle")
    return {"id": artwork.id, "artwork": artwork.name, "artist": artwork.artist, "image_url": artwork.image_url}


@router.post("/run", status_code=status.HTTP_200_OK)
def run_raffle_endpoint(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
    artwork_id: int | None = Body(None, embed=True)
):
    result = run_raffle_single(db, artwork_id=artwork_id)
    if "detail" in result:
        raise HTTPException(status_code=400, detail=result["detail"])
    return result


@router.get("/awarded", status_code=status.HTTP_200_OK)
def get_awarded_artworks(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    ids = [r.artwork_id for r in db.query(Raffle.artwork_id).filter(Raffle.status == RaffleStatus.COMPLETED).all()]
    return {"awarded": ids}


@router.get("/available-count")
def available_artworks_count(db: Session = Depends(get_db)):
    awarded_ids = {r.artwork_id for r in db.query(Raffle.artwork_id).filter(Raffle.status == RaffleStatus.COMPLETED).all()}
    count = db.query(models.Artwork).filter(models.Artwork.id.notin_(awarded_ids) if awarded_ids else True).count()
    return {"count": count}


@router.get("/last-result")
def get_last_result(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    raffle = (
        db.query(Raffle)
        .filter(Raffle.status == RaffleStatus.COMPLETED)
        .order_by(Raffle.drawn_at.desc())
        .first()
    )
    if not raffle or not raffle.winner_ticket:
        return {"result": None}
    return {
        "result": {
            "participant": raffle.winner_ticket.participant.full_name,
            "artwork":     raffle.artwork.name,
            "artist":      raffle.artwork.artist,
            "won_at":      raffle.drawn_at.strftime("%d/%m/%Y %H:%M"),
        }
    }


@router.get("/validate/{artwork_id}", status_code=status.HTTP_200_OK)
def validate_artwork(
    artwork_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    already = db.query(Raffle).filter(Raffle.artwork_id == artwork_id, Raffle.status == RaffleStatus.COMPLETED).first()
    return {"valid": already is None}


@router.post("/reset", status_code=204)
def reset_raffle(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    db.execute(text("TRUNCATE TABLE raffles RESTART IDENTITY CASCADE"))
    db.query(models.Ticket).update({models.Ticket.status: models.TicketStatus.ELIGIBLE})
    db.commit()


@router.get("/history", status_code=status.HTTP_200_OK)
def get_raffle_history(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    raffles = (
        db.query(Raffle)
        .options(
            joinedload(Raffle.artwork),
            joinedload(Raffle.winner_ticket).joinedload(models.Ticket.participant)
        )
        .filter(Raffle.status == RaffleStatus.COMPLETED)
        .order_by(Raffle.drawn_at.desc())
        .all()
    )

    history = []
    for r in raffles:
        history.append({
            "raffle_id": r.id,
            "drawn_at": r.drawn_at,
            "artwork_name": r.artwork.name if r.artwork else "N/A",
            "artist": r.artwork.artist if r.artwork else "N/A",
            "winner_full_name": r.winner_ticket.participant.full_name if r.winner_ticket and r.winner_ticket.participant else "N/A",
            "ticket_number": r.winner_ticket.ticket_number if r.winner_ticket else "N/A",
        })

    return history
