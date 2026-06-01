from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import httpx
import re

from app.database.db import get_db
from app.models.models import User, PopcornEntry, CustomGroup
from app.schemas import schemas
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/popcorn", tags=["Watchlist CRUD"])

@router.get("/", response_model=List[schemas.PopcornEntryOut])
def get_entries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(PopcornEntry).filter(PopcornEntry.user_id == current_user.id).order_by(PopcornEntry.created_at.desc()).all()

@router.post("/", response_model=schemas.PopcornEntryOut, status_code=status.HTTP_201_CREATED)
def create_entry(entry: schemas.PopcornEntryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    groups = []
    if entry.group_ids:
        groups = db.query(CustomGroup).filter(CustomGroup.id.in_(entry.group_ids), CustomGroup.user_id == current_user.id).all()

    new_entry = PopcornEntry(
        user_id=current_user.id,
        title=entry.title,
        category=entry.category,
        language=entry.language,
        rating=entry.rating,
        synopsis=entry.synopsis,
        reasons_for_liking=entry.reasons_for_liking,
        genres=entry.genres,
        poster_url=entry.poster_url,
        poster_data=entry.poster_data,
        my_rating=entry.my_rating,
        is_seen=entry.is_seen,
        is_watching=entry.is_watching,
        tags=entry.tags,
        custom_groups=groups
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.put("/{entry_id}", response_model=schemas.PopcornEntryOut)
def update_entry(entry_id: int, entry_data: schemas.PopcornEntryUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_entry = db.query(PopcornEntry).filter(PopcornEntry.id == entry_id, PopcornEntry.user_id == current_user.id).first()
    if not db_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist entry not found")

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
def delete_entry(entry_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_entry = db.query(PopcornEntry).filter(PopcornEntry.id == entry_id, PopcornEntry.user_id == current_user.id).first()
    if not db_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist entry not found")

    db.delete(db_entry)
    db.commit()
    return None

@router.get("/extract-poster")
async def extract_poster_url(url: str = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0, follow_redirects=True)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Could not fetch page URL")
            
            html = response.text
            
            patterns = [
                r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
                r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
                r'<link[^>]+rel=["\']image_src["\'][^>]+href=["\']([^"\']+)["\']'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    image_url = match.group(1)
                    if image_url.startswith("//"):
                        image_url = "https:" + image_url
                    return {"poster_url": image_url}
            
            raise HTTPException(status_code=404, detail="No poster image found in meta tags")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract poster: {str(e)}")
