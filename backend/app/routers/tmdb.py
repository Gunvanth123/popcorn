from fastapi import APIRouter, Depends, HTTPException, Query
import httpx
import os
import asyncio
from typing import List, Optional
from app.services.auth import get_current_user
from app.services.cache import cache_store
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.models import PopcornEntry

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

    # Otherwise, fetch from TMDB (multiple pages per category for 50 items)
    async with httpx.AsyncClient() as client:

        async def fetch_multi_page(url: str, base_params: dict, media_type: str = "movie", pages: int = 3) -> list:
            """Fetch multiple pages and merge, returning up to pages*20 items."""
            all_items = []
            for p in range(1, pages + 1):
                items = await fetch_tmdb_list(client, url, {**base_params, "page": p}, media_type)
                all_items.extend(items)
            # Deduplicate by title
            seen = set()
            deduped = []
            for item in all_items:
                key = (item.get("title") or "").lower().strip()
                if key and key not in seen:
                    seen.add(key)
                    deduped.append(item)
            return deduped

        base = "https://api.themoviedb.org/3"
        ak = api_key

        tasks = {
            # Trending – fetch 3 pages (60 items) then cap at 50
            "trending_top_10": fetch_multi_page(f"{base}/trending/all/week", {"api_key": ak}, pages=3),
            # Top Rated Movies
            "top_rated": fetch_multi_page(f"{base}/movie/top_rated", {"api_key": ak}, pages=3),
            # Top Web Series
            "web_series": fetch_multi_page(f"{base}/tv/top_rated", {"api_key": ak}, media_type="tv", pages=3),
            # Anime
            "anime_movies": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_genres": "16", "with_original_language": "ja", "sort_by": "popularity.desc"}, pages=3),
            "anime_series": fetch_multi_page(f"{base}/discover/tv", {"api_key": ak, "with_genres": "16", "with_original_language": "ja", "sort_by": "popularity.desc"}, media_type="tv", pages=3),
            # Languages
            "telugu": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_original_language": "te", "sort_by": "popularity.desc"}, pages=3),
            "hindi": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_original_language": "hi", "sort_by": "popularity.desc"}, pages=3),
            "english": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_original_language": "en", "sort_by": "popularity.desc"}, pages=3),
            "tamil": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_original_language": "ta", "sort_by": "popularity.desc"}, pages=3),
            "kannada": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_original_language": "kn", "sort_by": "popularity.desc"}, pages=3),
            "korean": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_original_language": "ko", "sort_by": "popularity.desc"}, pages=3),
            "french": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_original_language": "fr", "sort_by": "popularity.desc"}, pages=3),
            "spanish": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_original_language": "es", "sort_by": "popularity.desc"}, pages=3),
            # Genres  (genre IDs: 28=Action, 35=Comedy, 53=Thriller, 27=Horror, 878=Sci-Fi, 18=Drama, 10749=Romance, 99=Documentary, 12=Adventure, 14=Fantasy)
            "action": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_genres": "28", "sort_by": "popularity.desc"}, pages=3),
            "comedy": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_genres": "35", "sort_by": "popularity.desc"}, pages=3),
            "thriller": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_genres": "53", "sort_by": "popularity.desc"}, pages=3),
            "horror": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_genres": "27", "sort_by": "popularity.desc"}, pages=3),
            "sci_fi": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_genres": "878", "sort_by": "popularity.desc"}, pages=3),
            "drama": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_genres": "18", "sort_by": "popularity.desc"}, pages=3),
            "romance": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_genres": "10749", "sort_by": "popularity.desc"}, pages=3),
            "documentary": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_genres": "99", "sort_by": "popularity.desc"}, pages=3),
            "adventure": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_genres": "12", "sort_by": "popularity.desc"}, pages=3),
            "fantasy": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "with_genres": "14", "sort_by": "popularity.desc"}, pages=3),
            # Recently Released & Upcoming
            "recently_released": fetch_multi_page(f"{base}/movie/now_playing", {"api_key": ak}, pages=3),
            "upcoming": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "primary_release_date.gte": "2026-06-01", "sort_by": "popularity.desc"}, pages=3),
            # Bonus
            "top_classics": fetch_multi_page(f"{base}/discover/movie", {"api_key": ak, "sort_by": "vote_average.desc", "vote_count.gte": "2000", "primary_release_date.lte": "2000-12-31"}, pages=3),
            "popular_series": fetch_multi_page(f"{base}/tv/popular", {"api_key": ak}, media_type="tv", pages=3),
        }

        # Run all in parallel
        keys = list(tasks.keys())
        results = await asyncio.gather(*[tasks[k] for k in keys])

        # Assemble response – cap each list at 50
        recommendations = {}
        for i, key in enumerate(keys):
            recommendations[key] = results[i][:50]

        # Cache for 12 hours
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


# Genre name to ID mapping helper
GENRE_NAME_TO_ID = {v.lower(): k for k, v in GENRE_MAP.items()}


@router.get("/similar")
async def get_similar_movies(
    title: str = Query(...),
    category: str = Query("Movie"),
    current_user = Depends(get_current_user)
):
    api_key = os.getenv("TMDB_API_KEY") or "a88ceb5966b80295efceb4520b7f61c1"
    
    # 1. Search for the item to find its ID
    is_tv = "Series" in category or "tv" in category.lower()
    search_type = "tv" if is_tv else "movie"
    search_url = f"https://api.themoviedb.org/3/search/{search_type}"
    
    async with httpx.AsyncClient() as client:
        try:
            search_res = await client.get(search_url, params={"api_key": api_key, "query": title}, timeout=10.0)
            if search_res.status_code != 200:
                return []
            search_data = search_res.json()
            results = search_data.get("results", [])
            if not results:
                return []
            
            item_id = results[0]["id"]
            
            # 2. Fetch similar items
            similar_url = f"https://api.themoviedb.org/3/{search_type}/{item_id}/similar"
            similar_res = await client.get(similar_url, params={"api_key": api_key, "page": 1}, timeout=10.0)
            
            similar_results = []
            if similar_res.status_code == 200:
                similar_data = similar_res.json()
                similar_results = similar_data.get("results", [])
                
            if similar_results:
                parsed_items = []
                for item in similar_results:
                    item["media_type"] = "tv" if is_tv else "movie"
                    parsed = parse_tmdb_item(item)
                    if parsed["title"]:
                        parsed_items.append(parsed)
                return parsed_items[:12]
            
            # Fallback to Discover using genres if similar endpoint fails or returns empty
            genre_ids = [str(gid) for gid in results[0].get("genre_ids", [])]
            if genre_ids:
                genre_query = ",".join(genre_ids[:2])
                discover_url = f"https://api.themoviedb.org/3/discover/{search_type}"
                discover_res = await client.get(
                    discover_url,
                    params={
                        "api_key": api_key,
                        "with_genres": genre_query,
                        "sort_by": "popularity.desc",
                        "page": 1
                    },
                    timeout=10.0
                )
                if discover_res.status_code == 200:
                    discover_data = discover_res.json()
                    discover_results = discover_data.get("results", [])
                    parsed_items = []
                    for item in discover_results:
                        if item.get("id") != item_id:
                            item["media_type"] = "tv" if is_tv else "movie"
                            parsed = parse_tmdb_item(item)
                            if parsed["title"]:
                                parsed_items.append(parsed)
                    return parsed_items[:12]
            
            return []
        except Exception as e:
            print(f"Error fetching similar movies: {e}")
            return []


@router.get("/personalized-recommendations")
async def get_personalized_recommendations(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    api_key = os.getenv("TMDB_API_KEY") or "a88ceb5966b80295efceb4520b7f61c1"
    
    # 1. Fetch user's entries (seen and rated highly, or all in library)
    user_entries = db.query(PopcornEntry).filter(PopcornEntry.user_id == current_user.id).all()
    
    # Determine top genres from user library
    genre_counts = {}
    history_items = []
    for entry in user_entries:
        status = "Seen & Reviewed" if entry.is_seen else "Wishlisted"
        rating_str = f"Rating: {entry.my_rating}/5" if entry.my_rating else "No rating"
        note = f"Note: {entry.reasons_for_liking}" if entry.reasons_for_liking else ""
        tags = f"Tags: {entry.tags}" if entry.tags else ""
        history_items.append(
            f"- Title: {entry.title} ({entry.category}). Status: {status}. {rating_str}. Genres: {entry.genres}. {tags} {note}"
        )
        if entry.genres:
            # Check rating weight
            weight = 3 if (entry.my_rating and entry.my_rating >= 4.0) else 1
            for g in entry.genres.split(", "):
                g_clean = g.strip().lower()
                genre_counts[g_clean] = genre_counts.get(g_clean, 0) + weight

    user_profile = "\n".join(history_items) if history_items else "User watch history is currently empty. Recommending popular trending movies."

    # Sort genres by frequency
    sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
    top_genre_ids = []
    
    for g_name, _ in sorted_genres[:2]:
        gid = GENRE_NAME_TO_ID.get(g_name)
        if gid:
            top_genre_ids.append(str(gid))

    # 2. Build URL and params
    async with httpx.AsyncClient() as client:
        tasks = []
        if top_genre_ids:
            # Query TMDB discover using top user genres
            genre_query = ",".join(top_genre_ids)
            tasks.append(fetch_tmdb_list(client, "https://api.themoviedb.org/3/discover/movie", {
                "api_key": api_key,
                "with_genres": genre_query,
                "sort_by": "popularity.desc",
                "page": 1
            }))
            tasks.append(fetch_tmdb_list(client, "https://api.themoviedb.org/3/discover/movie", {
                "api_key": api_key,
                "with_genres": genre_query,
                "sort_by": "popularity.desc",
                "page": 2
            }))
        
        # Always add trending movies to candidate recommendations pool
        tasks.append(fetch_tmdb_list(client, "https://api.themoviedb.org/3/trending/all/week", {
            "api_key": api_key,
            "page": 1
        }))
        
        results_lists = await asyncio.gather(*tasks)
        
        # Deduplicate candidates
        candidates = []
        seen_titles = set()
        for r_list in results_lists:
            for item in r_list:
                title_key = item["title"].lower().strip()
                if title_key not in seen_titles:
                    seen_titles.add(title_key)
                    candidates.append(item)
                    
        # Exclude already tracked items
        already_tracked = {entry.title.lower().strip() for entry in user_entries}
        candidates = [c for c in candidates if c["title"].lower().strip() not in already_tracked]
        
        if not candidates:
            return await fetch_tmdb_list(client, "https://api.themoviedb.org/3/trending/all/week", {"api_key": api_key, "page": 1})
            
        # Call Groq recommender
        from app.services.ai import call_groq_recommender
        return await call_groq_recommender(user_profile, candidates)

