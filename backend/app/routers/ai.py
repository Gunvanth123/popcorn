from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.models import User, PopcornEntry, GameEntry
from app.schemas import schemas
from app.services.auth import get_current_user
from app.services.ai import call_groq_chatbot

router = APIRouter(prefix="/api/ai", tags=["AI Integration"])

@router.post("/chat")
async def ai_chat(
    payload: schemas.ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch user's library entries based on mode (Full Session Context)
    user_profile = ""
    history_items = []
    
    if payload.app_mode == "gamecorn":
        user_entries = db.query(GameEntry).filter(GameEntry.user_id == current_user.id).all()
        for entry in user_entries:
            status_str = "Played & Reviewed" if entry.is_played else "Playlist (Wishlist)"
            rating_str = f"Rating: {entry.my_rating}/5" if entry.my_rating else "No rating"
            note = f"Note: {entry.reasons_for_liking}" if entry.reasons_for_liking else ""
            tags = f"Tags: {entry.tags}" if entry.tags else ""
            history_items.append(
                f"- Title: {entry.title} ({entry.platform}). Status: {status_str}. {rating_str}. Genres: {entry.genres}. {tags} {note}"
            )
        user_profile = "\n".join(history_items) if history_items else "User game library is currently empty."
    else:
        user_entries = db.query(PopcornEntry).filter(PopcornEntry.user_id == current_user.id).all()
        for entry in user_entries:
            status_str = "Seen & Reviewed" if entry.is_seen else "Wishlisted"
            rating_str = f"Rating: {entry.my_rating}/5" if entry.my_rating else "No rating"
            note = f"Note: {entry.reasons_for_liking}" if entry.reasons_for_liking else ""
            tags = f"Tags: {entry.tags}" if entry.tags else ""
            history_items.append(
                f"- Title: {entry.title} ({entry.category}). Status: {status_str}. {rating_str}. Genres: {entry.genres}. {tags} {note}"
            )
        user_profile = "\n".join(history_items) if history_items else "User movie/series library is currently empty."

    # Convert schema messages to list of dict
    messages_dict = [{"role": msg.role, "content": msg.content} for msg in payload.messages]

    # 2. Call the AI chatbot service
    response_data = await call_groq_chatbot(user_profile, messages_dict, payload.app_mode)
    
    return response_data
