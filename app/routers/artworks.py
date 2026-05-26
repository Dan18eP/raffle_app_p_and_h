import os, uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db import models
from app.db.schemas.artwork import ArtworkCreate, ArtworkOut, ArtworkUpdate
from typing import List, Optional
from app.utils.storage import upload_file_to_supabase, delete_file_from_supabase

from sqlalchemy import text

router = APIRouter(
    prefix="/artworks",
    tags=["Artworks"]
)

# RESET ALL (TESTING ONLY)
@router.delete("/reset/all", status_code=status.HTTP_204_NO_CONTENT)
def reset_artworks(db: Session = Depends(get_db)):
    artworks = db.query(models.Artwork).all()
    for artwork in artworks:
        if artwork.image_url:
            try:
                delete_file_from_supabase(artwork.image_url)
            except:
                pass # Continue even if file delete fails
    
    db.execute(text("TRUNCATE TABLE artworks RESTART IDENTITY CASCADE"))
    db.commit()


#CREATE
@router.post("/", response_model=ArtworkOut, status_code=status.HTTP_201_CREATED)
def create_artwork(
    name: str = Form(...), 
    artist: str = Form(...), 
    image: UploadFile = File(None), 
    db: Session = Depends(get_db)
):
    image_url = None
    
    if image:
        try:
            # Read file content as bytes for supabase
            contents = image.file.read()
            image_url = upload_file_to_supabase(contents, image.filename, image.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
        
    db_artwork = models.Artwork(name=name, artist=artist, image_url=image_url)
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
    return db.query(models.Artwork).order_by(models.Artwork.id.asc()).all()

#COUNT ARTWORKS
@router.get("/count")
def get_artworks_count(db: Session = Depends(get_db)):
    return {"count": db.query(models.Artwork).count()}

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
    name: Optional[str] = Form(None),
    artist: Optional[str] = Form(None),
    image: UploadFile = File(None),
    remove_image: bool = Form(False),
    db: Session = Depends(get_db)
):
    artwork = db.query(models.Artwork).filter(
        models.Artwork.id == artwork_id
    ).first()

    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")

    if name:
        artwork.name = name
    if artist:
        artwork.artist = artist
        
    if remove_image and not image:
        if artwork.image_url:
            delete_file_from_supabase(artwork.image_url)
        artwork.image_url = None
    
    if image:
        # Delete old image if exists
        if artwork.image_url:
            delete_file_from_supabase(artwork.image_url)
        
        # Upload new image
        try:
            contents = image.file.read()
            artwork.image_url = upload_file_to_supabase(contents, image.filename, image.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload new image: {str(e)}")

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
    
    # Delete associated image file from Supabase if exists
    if artwork.image_url:
        delete_file_from_supabase(artwork.image_url)

    db.delete(artwork)
    db.commit()
