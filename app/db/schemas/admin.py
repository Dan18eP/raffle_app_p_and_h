from pydantic import BaseModel, EmailStr, Field


#ADMIN
class AdminBase(BaseModel):
    username: str
    email: EmailStr
    is_active: bool

class AdminCreate(AdminBase):
    password: str = Field(..., max_length=72, min_length=8, description="Password must be between 8 and 72 characters")

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class AdminOut(AdminBase):
    id: int
    is_active: bool
    

    class Config:
        from_attributes = True
