from pydantic import BaseModel

class ArtworkBase(BaseModel):
    name: str
    artist: str


class ArtworkCreate(ArtworkBase):
    pass


class ArtworkOut(ArtworkBase):
    id: int

    class Config:
        from_attributes = True
