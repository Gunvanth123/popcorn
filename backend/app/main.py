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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins (e.g., Vercel frontend domain)
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
