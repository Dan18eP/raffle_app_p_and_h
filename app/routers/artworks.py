import os, shutil, uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from db.database import get_db
from db import models
from db.schemas.artwork import ArtworkCreate, ArtworkOut, ArtworkUpdate
from typing import List, Optional

# 
UPLOAD_DIR = "static/artworks"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(
    prefix="/artworks",
    tags=["Artworks"]
)

#CREATE
@router.post("/", response_model=ArtworkOut, status_code=status.HTTP_201_CREATED)
def create_artwork(name: str = Form(...), artist: str = Form(...), image: UploadFile = File(None), db: Session = Depends(get_db)):
    
    image_url = None
    
    if image:
        file_ext = os.path.splitext(image.filename)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        image_url = f"/static/artworks/{filename}"
        
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
    
    get_all = db.query(models.Artwork).all()

    return get_all

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
        
    if remove_image and not image:  # Only remove without new upload
        if artwork.image_url:
            old_path = artwork.image_url.lstrip("/")
            if os.path.exists(old_path): os.remove(old_path)
        artwork.image_url = None
    
    if image:
        #Delete old image if exists
        if artwork.image_url:
            old_path = artwork.image_url.lstrip("/")
            if os.path.exists(old_path):
                os.remove(old_path)
        
        #Save new image
        file_ext = os.path.splitext(image.filename)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        artwork.image_url = f"/static/artworks/{filename}"

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
    
    #Delete associated image file if exists
    if artwork.image_url:
        filepath = artwork.image_url.lstrip("/")
        if os.path.exists(filepath):
            os.remove(filepath)

    db.delete(artwork)
    db.commit()
