# Raffle router: endpoint to run the raffle

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import text

from db.database import get_db
from db import models
from services.raffle import run_raffle, run_raffle_single
from routers.auth import get_current_admin

router = APIRouter(
    prefix="/raffle",
    tags=["Raffle"]
)


@router.post(
    "/test",
    status_code=status.HTTP_200_OK
)
def run_raffle_test_endpoint(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    #Safety check: prevent multiple runs
    already_run = db.query(models.RaffleResult).first()
    if already_run:
        raise HTTPException(
            status_code=409,
            detail="Raffle has already been executed"
        )

    result = run_raffle(db)

    if "detail" in result:
        raise HTTPException(
            status_code=400,
            detail=result["detail"]
        )

    return result

@router.get(
    "/next",
    status_code=status.HTTP_200_OK
)
def get_next_artwork(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    # Get next artwork that hasn't been awarded yet
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
        raise HTTPException(status_code=404, detail="No artworks available for raffle")

    return {"id": artwork.id, "artwork": artwork.name}


@router.post(
    "/run",
    status_code=status.HTTP_200_OK
)

def run_raffle_endpoint(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
    artwork_id: int | None = Body(None, embed=True)
):
    # Run raffle for the given artwork_id if provided; otherwise choose next available
    result = run_raffle_single(db, artwork_id=artwork_id)

    if "detail" in result:
        raise HTTPException(
            status_code=400,
            detail=result["detail"]
        )

    return result

@router.get(
    "/awarded",
    status_code=status.HTTP_200_OK
)
def get_awarded_artworks(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    # Return list of artwork ids that have been awarded
    awarded = db.query(models.RaffleResult.artwork_id).all()
    ids = [a[0] for a in awarded]
    return {"awarded": ids}

@router.get(
    "/validate/{artwork_id}",
    status_code=status.HTTP_200_OK
)
def validate_artwork(
    artwork_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    # check if artwork already awarded
    exists = (
        db.query(models.RaffleResult)
        .filter(models.RaffleResult.artwork_id == artwork_id)
        .first()
    )

    return {"valid": exists is None}


@router.post("/reset", status_code=204)
def reset_raffle(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    db.execute(text('TRUNCATE TABLE raffle_results RESTART IDENTITY'))
    db.commit()