# Raffle service logic

MAX_WINS_PER_PARTICIPANT = 4

import random
from sqlalchemy.orm import Session
from sqlalchemy import func

from db import models


def run_raffle(db: Session) -> dict:
    artworks = db.query(models.Artwork).all()
    if not artworks:
        return {"detail": "No artworks available for raffle"}

    results = []

    for artwork in artworks:
        participants = db.query(models.Participant).filter(
            models.Participant.tickets > 0
        ).all()

        weighted_participants = []
        weights = []

        for p in participants:
            wins = (
                db.query(func.count(models.RaffleResult.id))
                .filter(models.RaffleResult.participant_id == p.id)
                .scalar()
            )

            if wins >= MAX_WINS_PER_PARTICIPANT:
                continue

            weight = p.tickets / (1 + wins)
            weighted_participants.append(p)
            weights.append(weight)

        if not weighted_participants:
            break

        winner = random.choices(
            weighted_participants,
            weights=weights,
            k=1
        )[0]

        db.add(models.RaffleResult(
            participant_id=winner.id,
            artwork_id=artwork.id
        ))
        db.commit()

        results.append({
            "artwork": artwork.name,
            "winner": f"{winner.first_name} {winner.last_name}"
        })

    return {
        "total_awarded": len(results),
        "results": results
    }

from typing import Optional

def run_raffle_single(db: Session, artwork_id: Optional[int] = None) -> dict:
    # If an artwork_id is provided, use it (if not awarded yet)
    if artwork_id is not None:
        artwork = db.query(models.Artwork).filter(models.Artwork.id == artwork_id).first()
        if not artwork:
            return {"detail": "Artwork not found"}
        # ensure it's not already awarded
        already_awarded = db.query(models.RaffleResult).filter(models.RaffleResult.artwork_id == artwork_id).first()
        if already_awarded:
            return {"detail": "Artwork has already been awarded"}
    else:
        # obtain an artwork that hasn't been awarded yet
        artwork = (
            db.query(models.Artwork)
            .filter(
                ~models.Artwork.id.in_(
                    db.query(models.RaffleResult.artwork_id)
                )
            )
            .first()
        )

    if not artwork:
        return {"detail": "No artworks available for raffle"}

    #obtain participants with tickets
    participants = db.query(models.Participant).filter(
        models.Participant.tickets > 0
    ).all()

    weighted_participants = []
    weights = []

    for p in participants:
        wins = (
            db.query(func.count(models.RaffleResult.id))
            .filter(models.RaffleResult.participant_id == p.id)
            .scalar()
        )

        if wins >= MAX_WINS_PER_PARTICIPANT:
            continue

        #logic for weight calculation
        weight = p.tickets / (1 + wins)

        weighted_participants.append(p)
        weights.append(weight)

    if not weighted_participants:
        return {"detail": "No eligible participants"}

    # random.choices with weights to pick a winner
    winner = random.choices(
        weighted_participants,
        weights=weights,
        k=1
    )[0]

    #Record the raffle result
    raffle_result = models.RaffleResult(
        participant_id=winner.id,
        artwork_id=artwork.id
    )

    db.add(raffle_result)
    db.commit()
    db.refresh(raffle_result)

    return {
        "artwork": artwork.name,
        "winner": f"{winner.first_name} {winner.last_name}",
        "participant_id": winner.id,
        "tickets": winner.tickets
    }