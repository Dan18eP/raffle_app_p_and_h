from pydantic import BaseModel

class ArtworkBase(BaseModel):
    name: str
    artist: str


class ArtworkCreate(ArtworkBase):
    pass

class ArtworkUpdate(BaseModel):
    name: str | None = None
    artist: str | None = None
    

class ArtworkOut(ArtworkBase):
    id: int

    class Config:
        from_attributes = True
