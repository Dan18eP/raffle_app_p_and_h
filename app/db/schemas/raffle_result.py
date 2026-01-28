from pydantic import BaseModel
from datetime import datetime

class RaffleResultBase(BaseModel):
    participant_id: int
    artwork_id: int


class RaffleResultCreate(RaffleResultBase):
    pass


class RaffleResultOut(RaffleResultBase):
    id: int
    won_at: datetime

    class Config:
        from_attributes = True
