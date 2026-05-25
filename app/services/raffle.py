# app/services/raffle.py
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import Raffle, RaffleStatus, Ticket, TicketStatus, Artwork


def _get_winner_participant_ids(db: Session) -> set:
    """Retorna IDs de participantes que ya ganaron alguna obra."""
    previous_winners = (
        db.query(Ticket.participant_id)
        .join(Raffle, Raffle.winner_ticket_id == Ticket.id)
        .filter(Raffle.status == RaffleStatus.COMPLETED)
        .distinct()
        .all()
    )
    return {row.participant_id for row in previous_winners}


def _get_eligible_tickets(winner_ids: set, db: Session):
    """Boletas globales elegibles, excluyendo participantes que ya ganaron."""
    query = db.query(Ticket).filter(
        Ticket.status == TicketStatus.ELIGIBLE,
    )
    if winner_ids:
        query = query.filter(Ticket.participant_id.notin_(winner_ids))
    return query


def run_raffle_single(db: Session, artwork_id: int = None) -> dict:
    """
    Sortea UN artwork específico.
    Mantiene el contrato de respuesta del frontend:
    { artwork, winner, participant_id }
    """
    # 1. Obtener artwork
    if artwork_id is not None:
        artwork = db.query(Artwork).filter(Artwork.id == artwork_id).first()
        if not artwork:
            return {"detail": "Artwork not found"}
        already = db.query(Raffle).filter(
            Raffle.artwork_id == artwork_id,
            Raffle.status == RaffleStatus.COMPLETED,
        ).first()
        if already:
            return {"detail": "Artwork has already been awarded"}
    else:
        awarded_ids = (
            db.query(Raffle.artwork_id)
            .filter(Raffle.status == RaffleStatus.COMPLETED)
            .all()
        )
        excluded = {r.artwork_id for r in awarded_ids}
        artwork = (
            db.query(Artwork)
            .filter(Artwork.id.notin_(excluded) if excluded else True)
            .first()
        )
        if not artwork:
            return {"detail": "No artworks available for raffle"}

    # 2. Boletas elegibles globales; cada boleta representa una oportunidad
    winner_ids = _get_winner_participant_ids(db)
    eligible_tickets_query = _get_eligible_tickets(winner_ids, db)
    
    winner_ticket = eligible_tickets_query.order_by(func.random()).first()
    
    if not winner_ticket:
        return {"detail": "No eligible participants or tickets available"}

    # 3. Obtener o crear Raffle para este artwork
    raffle = db.query(Raffle).filter(
        Raffle.artwork_id == artwork.id,
    ).first()

    if not raffle:
        raffle = Raffle(artwork_id=artwork.id, status=RaffleStatus.PENDING)
        db.add(raffle)

    # 4. Marcar boleta ganadora y cerrar sorteo
    winner_ticket.status     = TicketStatus.WINNER
    raffle.winner_ticket_id  = winner_ticket.id
    raffle.status            = RaffleStatus.COMPLETED
    raffle.drawn_at          = datetime.utcnow()

    db.commit()
    db.refresh(raffle)

    return {
        "artwork":        artwork.name,
        "winner":         winner_ticket.participant.full_name,
        "participant_id": winner_ticket.participant_id,
        "ticket_number":  winner_ticket.ticket_number,
    }


def run_raffle(db: Session) -> dict:
    """
    Sortea TODOS los artworks pendientes (modo test).
    Mantiene el contrato: { total_awarded, results }
    """
    # Artworks ya adjudicados
    awarded_ids = {
        r.artwork_id for r in
        db.query(Raffle.artwork_id)
        .filter(Raffle.status == RaffleStatus.COMPLETED)
        .all()
    }

    artworks = db.query(Artwork).filter(
        Artwork.id.notin_(awarded_ids) if awarded_ids else True
    ).all()

    if not artworks:
        return {"detail": "No artworks available for raffle"}

    results = []

    for artwork in artworks:
        result = run_raffle_single(db, artwork_id=artwork.id)
        if "detail" in result:
            break
        results.append(result)

    return {
        "total_awarded": len(results),
        "results": results,
    }