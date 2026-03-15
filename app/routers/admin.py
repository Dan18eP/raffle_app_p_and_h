# Admin routes
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session


from db.database import get_db
from db import models
from db.schemas.admin import AdminCreate, AdminOut, PasswordChange
from .auth import get_current_admin, hash_password


router = APIRouter(
    prefix="/admins",
    tags=["Admins"]
)


@router.post("/bootstrap", response_model=AdminOut, status_code=201)
def create_first_admin(
    admin: AdminCreate,
    db: Session = Depends(get_db)
):
    if db.query(models.Admin).first():
        raise HTTPException(
            status_code=403,
            detail="Admin already exists"
        )

    db_admin = models.Admin(
        username=admin.username,
        email=admin.email,
        hashed_password = hash_password(admin.password),
        is_active=True
    )

    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)

    return db_admin

@router.post("/", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
def create_admin(
    admin: AdminCreate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):

    if db.query(models.Admin).filter(models.Admin.username == admin.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    if db.query(models.Admin).filter(models.Admin.email == admin.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    db_admin = models.Admin(
        username=admin.username,
        email=admin.email,
        hashed_password= hash_password(admin.password),
        is_active=admin.is_active
    )
    
    

    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)

    return db_admin


@router.patch("/me/password", status_code=200)
def change_my_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    if not pwd_context.verify(data.current_password, current_admin.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_admin.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)

def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    admin = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    if admin.id == 1:
        raise HTTPException(status_code=403, detail="Cannot delete the first admin")
   

    db.delete(admin)
    db.commit()


@router.get("/", response_model=list[AdminOut])
def get_admins(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin)
):
    return db.query(models.Admin).all()

