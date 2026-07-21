import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import (
    auth_router,
    briefs,
    changes,
    checks,
    competitors,
    notifications,
    settings_router,
    stats,
)

logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Competitor Intelligence Radar",
    description="AI-powered competitor monitoring — FastAPI + Groq + n8n automation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(competitors.router)
app.include_router(checks.router)
app.include_router(changes.router)
app.include_router(briefs.router)
app.include_router(notifications.router)
app.include_router(settings_router.router)
app.include_router(stats.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
