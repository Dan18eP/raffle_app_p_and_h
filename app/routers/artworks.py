from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from db import models
from db.schemas.artwork import ArtworkCreate, ArtworkOut, ArtworkUpdate
from typing import List

router = APIRouter(
    prefix="/artworks",
    tags=["Artworks"]
)

#CREATE
@router.post("/", response_model=ArtworkOut, status_code=status.HTTP_201_CREATED)
def create_artwork(artwork: ArtworkCreate, db: Session = Depends(get_db)):
    db_artwork = models.Artwork(**artwork.model_dump())
    db.add(db_artwork)
    db.commit()
    db.refresh(db_artwork)
    return db_artwork

#CREATE BULK
@router.post("/bulk", response_model=list[ArtworkOut], status_code=status.HTTP_201_CREATED)
def create_artworks_bulk(artworks: List[ArtworkCreate], db: Session = Depends(get_db)):

    db_artworks = [models.Artwork(**art.model_dump()) for art in artworks]

    db.add_all(db_artworks)
    db.commit()

    for art in db_artworks:
        db.refresh(art)

    return db_artworks


#READ ALL
@router.get("/", response_model=list[ArtworkOut])
def get_artworks(db: Session = Depends(get_db)):
    
    get_all = db.query(models.Artwork).all()

    return get_all


#READ ONE
@router.get("/{artwork_id}", response_model=ArtworkOut)
def get_artwork(artwork_id: int, db: Session = Depends(get_db)):
    artwork = db.query(models.Artwork).filter(
        models.Artwork.id == artwork_id
    ).first()

    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")

    return artwork


#UPDATE
@router.put("/{artwork_id}", response_model=ArtworkOut)
def update_artwork(
    artwork_id: int,
    artwork_data: ArtworkUpdate,
    db: Session = Depends(get_db)
):
    artwork = db.query(models.Artwork).filter(
        models.Artwork.id == artwork_id
    ).first()

    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")

    for key, value in artwork_data.model_dump(exclude_unset=True).items():
        setattr(artwork, key, value)

    db.commit()
    db.refresh(artwork)
    return artwork


#DELETE
@router.delete("/{artwork_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_artwork(artwork_id: int, db: Session = Depends(get_db)):
    artwork = db.query(models.Artwork).filter(
        models.Artwork.id == artwork_id
    ).first()

    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")

    db.delete(artwork)
    db.commit()
