# Main application file
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.db.database import engine, Base
from app.db import models # Ensure models are loaded
from app.routers import participants, artworks, auth, admin, raffle, tickets


# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Peace & Hope Raffle API")

from fastapi.middleware.cors import CORSMiddleware


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for now or keep user preference
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(participants.router)
app.include_router(artworks.router)

app.include_router(admin.router)
app.include_router(auth.router)

app.include_router(raffle.router)

app.include_router(tickets.router)


