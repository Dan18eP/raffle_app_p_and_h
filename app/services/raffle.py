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

