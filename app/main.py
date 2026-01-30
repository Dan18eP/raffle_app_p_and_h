# Main application file
from fastapi import FastAPI

from routers import participants, artworks, auth, admin, raffle

app = FastAPI(title="Peace & Hope Raffle API")

app.include_router(participants.router)
app.include_router(artworks.router)

app.include_router(admin.router)
app.include_router(auth.router)

app.include_router(raffle.router)

