from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
import sys

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

from src.apartment_agent.models import DailyDigest, SearchPreferences
from src.apartment_agent.scheduler import ApartmentScheduler
from src.apartment_agent.storage import Storage

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "src"))

storage = Storage(BASE_DIR / "data")
scheduler = ApartmentScheduler(storage)
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


@asynccontextmanager
async def lifespan(_: FastAPI):
    scheduler.start()
    scheduler.sync_with_saved_preferences()
    try:
        yield
    finally:
        scheduler.shutdown()


app = FastAPI(title="Apartment Finder Agent", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "title": "Apartment Finder Agent",
        },
    )


@app.get("/api/state")
def get_state() -> dict:
    return {
        "preferences": storage.load_preferences(),
        "latest_digest": storage.load_digest(),
        "config": scheduler.config_status(),
    }


@app.post("/api/preferences")
def save_preferences(preferences: SearchPreferences) -> dict:
    storage.save_preferences(preferences)
    scheduler.schedule_daily_job(preferences)
    return {"saved": True, "preferences": preferences.model_dump()}


@app.post("/api/refresh")
def refresh_now(preferences: SearchPreferences | None = None) -> DailyDigest:
    active_preferences = preferences or storage.load_preferences()
    if not active_preferences:
        raise HTTPException(status_code=400, detail="Save apartment preferences first.")

    try:
        digest = scheduler.run_once(active_preferences)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return digest
