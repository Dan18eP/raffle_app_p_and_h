# Main application file
from fastapi import FastAPI

from routers import participants, artworks

app = FastAPI(title="Peace & Hope Raffle API")

app.include_router(participants.router)
app.include_router(artworks.router)
