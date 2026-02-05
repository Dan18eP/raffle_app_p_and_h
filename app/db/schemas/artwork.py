from pydantic import BaseModel

class ArtworkBase(BaseModel):
    name: str
    artist: str
    image_url: str | None = None


class ArtworkCreate(ArtworkBase):
    pass

class ArtworkUpdate(BaseModel):
    name: str | None = None
    artist: str | None = None
    image_url: str | None = None
    

class ArtworkOut(ArtworkBase):
    id: int

    class Config:
        from_attributes = True
