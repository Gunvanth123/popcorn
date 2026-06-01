from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database.db import get_db
from app.models.models import User, PopcornEntry, GameEntry
from app.schemas import schemas
from app.services.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/onboard", response_model=schemas.UserOut)
def onboard_user(payload: schemas.OnboardingPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Update preferred languages
    current_user.preferred_languages = ",".join(payload.preferred_languages) if payload.preferred_languages else None
    current_user.onboarded = True
    
    # 2. Add movies/shows
    for movie in payload.movies:
        new_movie = PopcornEntry(
            user_id=current_user.id,
            title=movie.title,
            category=movie.category,
            language=movie.language,
            rating=movie.rating,
            synopsis=movie.synopsis,
            reasons_for_liking=movie.reasons_for_liking,
            genres=movie.genres,
            poster_url=movie.poster_url,
            poster_data=movie.poster_data,
            my_rating=movie.my_rating,
            is_seen=True,  # Seeding as liked/seen during onboarding
            is_watching=False,
            tags=movie.tags,
            custom_groups=[]
        )
        db.add(new_movie)
        
    # 3. Add games
    for game in payload.games:
        # Resolve synopsis logic
        synopsis = game.synopsis
        if not synopsis or "Released:" in synopsis or "Metacritic Score:" in synopsis:
            import httpx
            import os
            api_key = os.getenv("RAWG_API_KEY") or "e5b72dfeb6b349d4948a31e847c2b3e4"
            try:
                search_res = httpx.get("https://api.rawg.io/api/games", params={"key": api_key, "search": game.title, "page_size": 1}, timeout=5.0)
                if search_res.status_code == 200:
                    results = search_res.json().get("results", [])
                    if results:
                        game_id = results[0]["id"]
                        details_res = httpx.get(f"https://api.rawg.io/api/games/{game_id}", params={"key": api_key}, timeout=5.0)
                        if details_res.status_code == 200:
                            desc = details_res.json().get("description_raw") or details_res.json().get("description")
                            if desc:
                                synopsis = desc
            except Exception as e:
                print(f"Error auto-enriching game description on onboarding: {e}")
                
        new_game = GameEntry(
            user_id=current_user.id,
            title=game.title,
            platform=game.platform,
            rating=game.rating,
            synopsis=synopsis,
            reasons_for_liking=game.reasons_for_liking,
            genres=game.genres,
            poster_url=game.poster_url,
            poster_data=game.poster_data,
            my_rating=game.my_rating,
            is_played=True,  # Seeding as liked/played during onboarding
            is_playing=False,
            tags=game.tags,
            custom_groups=[]
        )
        db.add(new_game)
        
    db.commit()
    db.refresh(current_user)
    return current_user
