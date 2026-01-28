from pydantic import BaseModel, EmailStr


#ADMIN
class AdminBase(BaseModel):
    username: str
    email: EmailStr
    is_active: bool

class AdminCreate(AdminBase):
    password: str

class AdminOut(AdminBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
