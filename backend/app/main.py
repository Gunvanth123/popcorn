from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from sqlalchemy import text, inspect
from app.database.db import engine, Base
from app.routers import auth, popcorn, tmdb, games, rawg, ai, groups

def run_db_migrations():
    inspector = inspect(engine)
    
    # Migrate users
    user_cols = [c["name"] for c in inspector.get_columns("users")]
    if "preferred_languages" not in user_cols:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN preferred_languages VARCHAR(500) NULL"))
            conn.commit()
            print("Successfully added column preferred_languages to users table")
            
    if "onboarded" not in user_cols:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN onboarded BOOLEAN DEFAULT 0"))
            conn.commit()
            print("Successfully added column onboarded to users table")

    # Migrate popcorn_entries
    popcorn_cols = [c["name"] for c in inspector.get_columns("popcorn_entries")]
    if "is_watching" not in popcorn_cols:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE popcorn_entries ADD COLUMN is_watching BOOLEAN DEFAULT 0"))
            conn.commit()
            print("Successfully added column is_watching to popcorn_entries table")

    # Migrate game_entries
    game_cols = [c["name"] for c in inspector.get_columns("game_entries")]
    if "is_playing" not in game_cols:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE game_entries ADD COLUMN is_playing BOOLEAN DEFAULT 0"))
            conn.commit()
            print("Successfully added column is_playing to game_entries table")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically
    Base.metadata.create_all(bind=engine)
    # Run column migrations
    run_db_migrations()
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
app.include_router(ai.router)
app.include_router(groups.router)

@app.get("/")
def root():
    return {"message": "Welcome to Popcorn Watchlist API", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}
