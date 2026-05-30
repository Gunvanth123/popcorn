from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database.db import engine, Base
from app.routers import auth, popcorn, tmdb, games, rawg

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Popcorn Watchlist API",
    description="Backend API for Popcorn Watchlist application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configuration
# allow_origins=["*"] + allow_credentials=True is invalid — browsers block it.
# Read allowed origins from env var, fallback to safe defaults.
import os

ALLOWED_ORIGINS_RAW = os.getenv(
    "ALLOWED_ORIGINS",
    "https://popcorn-roan-five.vercel.app,http://localhost:5173,http://localhost:3000"
)

# Parse and clean origins (strip whitespace, quotes, and trailing slashes)
ALLOWED_ORIGINS = [
    origin.strip().strip("'\"").rstrip("/")
    for origin in ALLOWED_ORIGINS_RAW.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(popcorn.router)
app.include_router(tmdb.router)
app.include_router(games.router)
app.include_router(rawg.router)

@app.get("/")
def root():
    return {"message": "Welcome to Popcorn Watchlist API", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}
