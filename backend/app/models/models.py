from sqlalchemy import Table, Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.db import Base

# Many-to-many association tables for custom groups
popcorn_group_association = Table(
    "popcorn_group_association",
    Base.metadata,
    Column("popcorn_entry_id", Integer, ForeignKey("popcorn_entries.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", Integer, ForeignKey("custom_groups.id", ondelete="CASCADE"), primary_key=True)
)

game_group_association = Table(
    "game_group_association",
    Base.metadata,
    Column("game_entry_id", Integer, ForeignKey("game_entries.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", Integer, ForeignKey("custom_groups.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    entries = relationship("PopcornEntry", back_populates="user", cascade="all, delete-orphan")
    game_entries = relationship("GameEntry", back_populates="user", cascade="all, delete-orphan")
    custom_groups = relationship("CustomGroup", back_populates="user", cascade="all, delete-orphan")

class PopcornEntry(Base):
    __tablename__ = "popcorn_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # Movie, Series, Anime Movie, Anime Series
    language = Column(String(100), nullable=True)
    rating = Column(Float, nullable=True)  # TMDB rating normalized (0-5 popcorns)
    synopsis = Column(Text, nullable=True)
    reasons_for_liking = Column(Text, nullable=True)
    genres = Column(Text, nullable=True)  # Comma-separated
    poster_url = Column(Text, nullable=True)  # TMDB or remote URL
    poster_data = Column(Text, nullable=True)  # base64 data if uploaded locally
    my_rating = Column(Float, nullable=True)  # User's popcorn rating (0-5 scale, float)
    is_seen = Column(Boolean, default=False, server_default="false")  # Whether the user has seen it
    is_watching = Column(Boolean, default=False, server_default="false")  # Whether the user is currently watching it
    tags = Column(Text, nullable=True)  # Comma-separated user tags
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="entries")
    custom_groups = relationship("CustomGroup", secondary=popcorn_group_association, back_populates="popcorn_entries")

class GameEntry(Base):
    __tablename__ = "game_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    platform = Column(String(255), nullable=True)  # PC, Switch, PS5, Xbox, etc.
    rating = Column(Float, nullable=True)  # scaled to 0-5 popcorns
    synopsis = Column(Text, nullable=True)
    reasons_for_liking = Column(Text, nullable=True)
    genres = Column(Text, nullable=True)
    poster_url = Column(Text, nullable=True)
    poster_data = Column(Text, nullable=True)
    my_rating = Column(Float, nullable=True)  # user's rating 0.0 - 5.0
    is_played = Column(Boolean, default=False, server_default="false")
    is_playing = Column(Boolean, default=False, server_default="false")
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="game_entries")
    custom_groups = relationship("CustomGroup", secondary=game_group_association, back_populates="game_entries")

class CustomGroup(Base):
    __tablename__ = "custom_groups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # 'popcorn' or 'gamecorn'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="custom_groups")
    popcorn_entries = relationship("PopcornEntry", secondary=popcorn_group_association, back_populates="custom_groups")
    game_entries = relationship("GameEntry", secondary=game_group_association, back_populates="custom_groups")

