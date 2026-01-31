from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from .auth import get_current_admin
from ..main import templates

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
def login_view(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/dashboard", response_class=HTMLResponse)
def dashboard_view(
    request: Request,
    admin=Depends(get_current_admin)
):
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "admin": admin}
    )
