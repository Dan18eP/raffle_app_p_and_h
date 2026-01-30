# Raffle router: endpoint to run the raffle

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from db.database import get_db
from db import models
from services.raffle import run_raffle
from routers.auth import get_current_admin

router = APIRouter(
    prefix="/raffle",
    tags=["Raffle"]
)


@router.post(
    "/run",
    status_code=status.HTTP_200_OK
)
def run_raffle_endpoint(
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

@router.post("/reset", status_code=204)
def reset_raffle(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    db.execute(text('TRUNCATE TABLE raffle_results RESTART IDENTITY'))
    db.commit()