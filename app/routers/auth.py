# Authentication routes
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta



from db.database import get_db
from db import models
import os
from dotenv import load_dotenv

load_dotenv()

S_K = os.getenv("SECRET_KEY")
ALG = os.getenv("ALGORITHM")
A_T_E_M = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

router = APIRouter(tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)


@router.post("/login")
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    admin = db.query(models.Admin).filter(models.Admin.username == form.username).first()

    if not admin or not verify_password(form.password, admin.hashed_password):
        raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive admin"
        )

    token = create_access_token({
    "sub": str(admin.id)
})


    return {"access_token": token, 
            "token_type": "bearer"}



def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, S_K, algorithms=[ALG])
        admin_id: str = payload.get("sub")
        if admin_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    admin = db.query(models.Admin).filter(models.Admin.id == int(admin_id)).first()

    if not admin:
        raise credentials_exception

    return admin

def hash_password(password: str) -> str:
    #pre-hash with SHA-256
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=A_T_E_M))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, S_K, algorithm=ALG)