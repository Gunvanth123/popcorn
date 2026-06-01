from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.models import User, GameEntry, CustomGroup
from app.schemas import schemas
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/games", tags=["Games CRUD"])

@router.get("/", response_model=List[schemas.GameEntryOut])
def get_game_entries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(GameEntry).filter(GameEntry.user_id == current_user.id).order_by(GameEntry.created_at.desc()).all()

@router.post("/", response_model=schemas.GameEntryOut, status_code=status.HTTP_201_CREATED)
def create_game_entry(entry: schemas.GameEntryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    synopsis = entry.synopsis
    # If the synopsis is empty or uses the old placeholder format, fetch the real game description
    if not synopsis or "Released:" in synopsis or "Metacritic Score:" in synopsis:
        import httpx
        import os
        api_key = os.getenv("RAWG_API_KEY") or "e5b72dfeb6b349d4948a31e847c2b3e4"
        try:
            # Search game by title
            search_res = httpx.get("https://api.rawg.io/api/games", params={"key": api_key, "search": entry.title, "page_size": 1}, timeout=5.0)
            if search_res.status_code == 200:
                results = search_res.json().get("results", [])
                if results:
                    game_id = results[0]["id"]
                    # Fetch detailed info
                    details_res = httpx.get(f"https://api.rawg.io/api/games/{game_id}", params={"key": api_key}, timeout=5.0)
                    if details_res.status_code == 200:
                        desc = details_res.json().get("description_raw") or details_res.json().get("description")
                        if desc:
                            synopsis = desc
        except Exception as e:
            print(f"Error auto-enriching game description on creation: {e}")

    groups = []
    if entry.group_ids:
        groups = db.query(CustomGroup).filter(CustomGroup.id.in_(entry.group_ids), CustomGroup.user_id == current_user.id).all()

    new_entry = GameEntry(
        user_id=current_user.id,
        title=entry.title,
        platform=entry.platform,
        rating=entry.rating,
        synopsis=synopsis,
        reasons_for_liking=entry.reasons_for_liking,
        genres=entry.genres,
        poster_url=entry.poster_url,
        poster_data=entry.poster_data,
        my_rating=entry.my_rating,
        is_played=entry.is_played,
        is_playing=entry.is_playing,
        tags=entry.tags,
        rank=entry.rank,
        custom_groups=groups
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.put("/{entry_id}", response_model=schemas.GameEntryOut)
def update_game_entry(entry_id: int, entry_data: schemas.GameEntryUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_entry = db.query(GameEntry).filter(GameEntry.id == entry_id, GameEntry.user_id == current_user.id).first()
    if not db_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game entry not found")

    exclude_fields = {"group_ids"}
    for key, val in entry_data.model_dump(exclude_unset=True, exclude=exclude_fields).items():
        setattr(db_entry, key, val)

    if entry_data.group_ids is not None:
        groups = db.query(CustomGroup).filter(CustomGroup.id.in_(entry_data.group_ids), CustomGroup.user_id == current_user.id).all()
        db_entry.custom_groups = groups

    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_game_entry(entry_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_entry = db.query(GameEntry).filter(GameEntry.id == entry_id, GameEntry.user_id == current_user.id).first()
    if not db_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game entry not found")

    db.delete(db_entry)
    db.commit()
    return None
