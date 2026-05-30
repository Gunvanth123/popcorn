from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.models import User, GameEntry
from app.schemas import schemas
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/games", tags=["Games CRUD"])

@router.get("/", response_model=List[schemas.GameEntryOut])
def get_game_entries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(GameEntry).filter(GameEntry.user_id == current_user.id).order_by(GameEntry.created_at.desc()).all()

@router.post("/", response_model=schemas.GameEntryOut, status_code=status.HTTP_201_CREATED)
def create_game_entry(entry: schemas.GameEntryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_entry = GameEntry(
        user_id=current_user.id,
        title=entry.title,
        platform=entry.platform,
        rating=entry.rating,
        synopsis=entry.synopsis,
        reasons_for_liking=entry.reasons_for_liking,
        genres=entry.genres,
        poster_url=entry.poster_url,
        poster_data=entry.poster_data,
        my_rating=entry.my_rating,
        is_played=entry.is_played,
        tags=entry.tags
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

    for key, val in entry_data.model_dump(exclude_unset=True).items():
        setattr(db_entry, key, val)

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
