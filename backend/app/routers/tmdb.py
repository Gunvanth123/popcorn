from fastapi import APIRouter, Depends, HTTPException, Query
import httpx
import os
import asyncio
from typing import List, Optional
from app.services.auth import get_current_user
from app.services.cache import cache_store

router = APIRouter(prefix="/api/tmdb", tags=["TMDB Integrations"])

# TMDB Genre mappings
GENRE_MAP = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
    27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
    10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
    10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
    10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
}

LANGUAGES = {
    "en": "English", "ja": "Japanese", "ko": "Korean", "es": "Spanish",
    "fr": "French", "de": "German", "it": "Italian", "zh": "Chinese",
    "cn": "Chinese", "hi": "Hindi", "ru": "Russian", "pt": "Portuguese",
    "ta": "Tamil", "te": "Telugu", "ml": "Malayalam", "kn": "Kannada"
}

def parse_tmdb_item(item: dict) -> dict:
    media_type = item.get("media_type", "movie")
    genre_ids = item.get("genre_ids", [])
    
    # Check if animation/anime
    is_animation = 16 in genre_ids
    
    # Set proper category
    if is_animation:
        category = "Anime Movie" if media_type == "movie" else "Anime Series"
    else:
        category = "Movie" if media_type == "movie" else "Series"

    title = item.get("title") if media_type == "movie" else item.get("name")
    
    lang_code = item.get("original_language", "en")
    language = LANGUAGES.get(lang_code, lang_code.upper())
    
    vote_average = item.get("vote_average", 0.0)
    # Scale 0-10 to 0-5 popcorn rating
    rating = round(min(5.0, max(0.0, vote_average / 2.0)), 1)
    
    genres = [GENRE_MAP.get(gid, "Other") for gid in genre_ids if gid in GENRE_MAP]
    if not genres:
        genres = ["Other"]

    poster_path = item.get("poster_path")
    poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None

    return {
        "title": title,
        "category": category,
        "language": language,
        "rating": rating,
        "synopsis": item.get("overview", ""),
        "genres": ", ".join(genres),
        "poster_url": poster_url
    }

async def fetch_tmdb_list(client: httpx.AsyncClient, url: str, params: dict, default_media_type: str = "movie") -> list:
    try:
        response = await client.get(url, params=params, timeout=10.0)
        if response.status_code != 200:
            return []
        data = response.json()
        results = data.get("results", [])
        parsed_items = []
        for item in results:
            if "media_type" not in item:
                item["media_type"] = default_media_type
            parsed = parse_tmdb_item(item)
            if parsed.get("title"):
                parsed_items.append(parsed)
        return parsed_items
    except Exception as e:
        print(f"Error fetching tmdb list from {url}: {e}")
        return []

@router.get("/search")
async def search_tmdb(
    query: str = Query(..., min_length=1),
    current_user = Depends(get_current_user)
):
    api_key = os.getenv("TMDB_API_KEY") or "a88ceb5966b80295efceb4520b7f61c1"
    if not api_key:
        raise HTTPException(status_code=500, detail="TMDB API key not configured on server")

    cache_key = f"search:{query.lower().strip()}"
    cached_results = cache_store.get(cache_key)
    if cached_results:
        return cached_results

    url = "https://api.themoviedb.org/3/search/multi"
    params = {
        "api_key": api_key,
        "query": query,
        "language": "en-US",
        "page": 1
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="TMDB search failed")
            
            data = response.json()
            results = data.get("results", [])
            
            parsed_items = []
            for item in results:
                if item.get("media_type") in ["movie", "tv"]:
                    parsed_item = parse_tmdb_item(item)
                    if parsed_item["title"]:
                        parsed_items.append(parsed_item)
                        
            # Cache results for 2 hours
            cache_store.set(cache_key, parsed_items, ttl_seconds=7200)
            return parsed_items
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/trending")
async def get_trending_top_100(
    current_user = Depends(get_current_user)
):
    api_key = os.getenv("TMDB_API_KEY") or "a88ceb5966b80295efceb4520b7f61c1"
    if not api_key:
        raise HTTPException(status_code=500, detail="TMDB API key not configured on server")

    cache_key = "trending_top_100"
    cached_results = cache_store.get(cache_key)
    if cached_results:
        return cached_results

    # Fetch 5 pages to get exactly 100 items (20 per page)
    parsed_items = []
    async with httpx.AsyncClient() as client:
        try:
            for page in range(1, 6):
                url = f"https://api.themoviedb.org/3/trending/all/week"
                params = {
                    "api_key": api_key,
                    "page": page
                }
                response = await client.get(url, params=params, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    for item in results:
                        # Ensure it has a title or name and is movie or tv
                        if item.get("media_type") in ["movie", "tv"]:
                            parsed_item = parse_tmdb_item(item)
                            if parsed_item["title"]:
                                parsed_items.append(parsed_item)
                        else:
                            break
            
            # Clamp to top 100
            parsed_items = parsed_items[:100]
            
            # Cache results for 24 hours (86400 seconds)
            cache_store.set(cache_key, parsed_items, ttl_seconds=86400)
            return parsed_items
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations")
async def get_recommendations(
    current_user = Depends(get_current_user)
):
    api_key = os.getenv("TMDB_API_KEY") or "a88ceb5966b80295efceb4520b7f61c1"
    
    # Check cache first
    cache_key = "tmdb_recommendations_all"
    cached = cache_store.get(cache_key)
    if cached:
        return cached

    # Otherwise, fetch from TMDB
    async with httpx.AsyncClient() as client:
        # Define tasks
        tasks = {
            "trending_top_10": fetch_tmdb_list(client, "https://api.themoviedb.org/3/trending/all/week", {"api_key": api_key}),
            "top_rated": fetch_tmdb_list(client, "https://api.themoviedb.org/3/movie/top_rated", {"api_key": api_key, "page": 1}),
            "web_series": fetch_tmdb_list(client, "https://api.themoviedb.org/3/tv/top_rated", {"api_key": api_key, "page": 1}, "tv"),
            
            # Anime (16 is Animation, original language Japanese)
            "anime_movies": fetch_tmdb_list(client, "https://api.themoviedb.org/3/discover/movie", {"api_key": api_key, "with_genres": "16", "with_original_language": "ja", "sort_by": "popularity.desc"}),
            "anime_series": fetch_tmdb_list(client, "https://api.themoviedb.org/3/discover/tv", {"api_key": api_key, "with_genres": "16", "with_original_language": "ja", "sort_by": "popularity.desc"}, "tv"),
            
            # Languages
            "telugu": fetch_tmdb_list(client, "https://api.themoviedb.org/3/discover/movie", {"api_key": api_key, "with_original_language": "te", "sort_by": "popularity.desc"}),
            "english": fetch_tmdb_list(client, "https://api.themoviedb.org/3/discover/movie", {"api_key": api_key, "with_original_language": "en", "sort_by": "popularity.desc"}),
            "hindi": fetch_tmdb_list(client, "https://api.themoviedb.org/3/discover/movie", {"api_key": api_key, "with_original_language": "hi", "sort_by": "popularity.desc"}),
            "tamil": fetch_tmdb_list(client, "https://api.themoviedb.org/3/discover/movie", {"api_key": api_key, "with_original_language": "ta", "sort_by": "popularity.desc"}),
            "kannada": fetch_tmdb_list(client, "https://api.themoviedb.org/3/discover/movie", {"api_key": api_key, "with_original_language": "kn", "sort_by": "popularity.desc"}),
            
            # Genres (Action = 28, Comedy = 35)
            "action": fetch_tmdb_list(client, "https://api.themoviedb.org/3/discover/movie", {"api_key": api_key, "with_genres": "28", "sort_by": "popularity.desc"}),
            "comedy": fetch_tmdb_list(client, "https://api.themoviedb.org/3/discover/movie", {"api_key": api_key, "with_genres": "35", "sort_by": "popularity.desc"}),
        }
        
        # Run in parallel
        keys = list(tasks.keys())
        results = await asyncio.gather(*[tasks[k] for k in keys])
        
        # Assemble response
        recommendations = {}
        for i, key in enumerate(keys):
            limit = 10 if key == "trending_top_10" else 30
            recommendations[key] = results[i][:limit]
            
        # Cache for 12 hours (43200 seconds)
        cache_store.set(cache_key, recommendations, ttl_seconds=43200)
        return recommendations

@router.get("/discover")
async def discover_tmdb(
    media_type: str = Query("movie", description="movie or tv"),
    genre_id: Optional[str] = Query(None, description="Genre ID"),
    language: Optional[str] = Query(None, description="Language code"),
    sort_by: str = Query("popularity.desc"),
    page: int = Query(1, ge=1),
    current_user = Depends(get_current_user)
):
    api_key = os.getenv("TMDB_API_KEY") or "a88ceb5966b80295efceb4520b7f61c1"
    
    # Cache key based on parameters
    cache_key = f"discover:{media_type}:{genre_id}:{language}:{sort_by}:{page}"
    cached = cache_store.get(cache_key)
    if cached:
        return cached

    url = f"https://api.themoviedb.org/3/discover/{media_type}"
    params = {
        "api_key": api_key,
        "sort_by": sort_by,
        "page": page
    }
    if genre_id:
        params["with_genres"] = genre_id
    if language:
        params["with_original_language"] = language

    # For top_rated sort, filter by substantial vote count
    if "vote_average" in sort_by:
        params["vote_count.gte"] = 100

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="TMDB discover failed")
            
            data = response.json()
            results = data.get("results", [])
            
            parsed_items = []
            for item in results:
                item["media_type"] = media_type
                parsed_item = parse_tmdb_item(item)
                if parsed_item["title"]:
                    parsed_items.append(parsed_item)
            
            # Cache for 2 hours
            cache_store.set(cache_key, parsed_items, ttl_seconds=7200)
            return parsed_items
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

