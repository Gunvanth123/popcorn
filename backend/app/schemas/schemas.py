from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

# --- Popcorn Entry Schemas ---
class PopcornEntryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str
    language: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    synopsis: Optional[str] = None
    reasons_for_liking: Optional[str] = None
    genres: Optional[str] = None  # Comma-separated
    poster_url: Optional[str] = None
    poster_data: Optional[str] = None
    my_rating: Optional[float] = Field(None, ge=0, le=5)
    is_seen: Optional[bool] = False
    tags: Optional[str] = None

class PopcornEntryCreate(PopcornEntryBase):
    pass

class PopcornEntryUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    rating: Optional[float] = None
    synopsis: Optional[str] = None
    reasons_for_liking: Optional[str] = None
    genres: Optional[str] = None
    poster_url: Optional[str] = None
    poster_data: Optional[str] = None
    my_rating: Optional[float] = None
    is_seen: Optional[bool] = None
    tags: Optional[str] = None

class PopcornEntryOut(PopcornEntryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Game Entry Schemas ---
class GameEntryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    platform: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    synopsis: Optional[str] = None
    reasons_for_liking: Optional[str] = None
    genres: Optional[str] = None
    poster_url: Optional[str] = None
    poster_data: Optional[str] = None
    my_rating: Optional[float] = Field(None, ge=0, le=5)
    is_played: Optional[bool] = False
    tags: Optional[str] = None

class GameEntryCreate(GameEntryBase):
    pass

class GameEntryUpdate(BaseModel):
    title: Optional[str] = None
    platform: Optional[str] = None
    rating: Optional[float] = None
    synopsis: Optional[str] = None
    reasons_for_liking: Optional[str] = None
    genres: Optional[str] = None
    poster_url: Optional[str] = None
    poster_data: Optional[str] = None
    my_rating: Optional[float] = None
    is_played: Optional[bool] = None
    tags: Optional[str] = None

class GameEntryOut(GameEntryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


