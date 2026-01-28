from pydantic import BaseModel
from typing import Optional

class ParticipantBase(BaseModel):
    first_name: str
    last_name: str
    document_id: str
    tickets: int = 0


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    document_id: Optional[str] = None
    tickets: Optional[int] = None


class ParticipantOut(ParticipantBase):
    id: int

    class Config:
        from_attributes = True  
