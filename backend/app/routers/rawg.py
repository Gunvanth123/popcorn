from fastapi import APIRouter, Depends, HTTPException, Query
import httpx
import os
from typing import List, Optional
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import GameEntry
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/rawg", tags=["RAWG Games Integration"])

# In-memory simple cache
cache_store = {}

def parse_rawg_item(item: dict) -> dict:
    title = item.get("name")
    rating = round(item.get("rating", 0.0), 1)
    
    genres = [g.get("name") for g in item.get("genres", [])]
    if not genres:
        genres = ["Action"]
        
    platforms = []
    for p_obj in item.get("parent_platforms", []):
        p_name = p_obj.get("platform", {}).get("name")
        if p_name:
            if p_name == "Nintendo":
                p_name = "Nintendo Switch"
            platforms.append(p_name)
            
    if not platforms:
        platforms = ["PC"]
        
    poster_url = item.get("background_image")
    
    released = item.get("released", "N/A")
    metacritic = item.get("metacritic", "N/A")
    synopsis = f"Released: {released}. Metacritic Score: {metacritic}."
    
    return {
        "title": title,
        "platform": ", ".join(platforms),
        "rating": rating,
        "synopsis": synopsis,
        "genres": ", ".join(genres),
        "poster_url": poster_url,
        "rawg_id": item.get("id")
    }

async def fetch_rawg_list(client: httpx.AsyncClient, params: dict) -> list:
    url = "https://api.rawg.io/api/games"
    try:
        response = await client.get(url, params=params, timeout=10.0)
        if response.status_code != 200:
            print(f"RAWG list fetch failed: {response.status_code}")
            return []
        
        data = response.json()
        results = data.get("results", [])
        parsed_items = []
        for item in results:
            parsed = parse_rawg_item(item)
            if parsed["title"]:
                parsed_items.append(parsed)
        return parsed_items
    except Exception as e:
        print(f"Error fetching RAWG list: {e}")
        return []

@router.get("/search")
async def search_games(
    query: str = Query(..., min_length=1),
    current_user = Depends(get_current_user)
):
    api_key = os.getenv("RAWG_API_KEY") or "e5b72dfeb6b349d4948a31e847c2b3e4"
    
    cache_key = f"search_games:{query.lower().strip()}"
    if cache_key in cache_store:
        return cache_store[cache_key]
        
    url = "https://api.rawg.io/api/games"
    params = {
        "key": api_key,
        "search": query,
        "page_size": 15
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="RAWG search failed")
                
            data = response.json()
            results = data.get("results", [])
            
            parsed_items = []
            for item in results:
                parsed_item = parse_rawg_item(item)
                if parsed_item["title"]:
                    parsed_items.append(parsed_item)
                    
            # Cache results
            cache_store[cache_key] = parsed_items
            return parsed_items
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations")
async def get_recommendations(current_user = Depends(get_current_user)):
    api_key = os.getenv("RAWG_API_KEY") or "e5b72dfeb6b349d4948a31e847c2b3e4"
    
    cache_key = "games_recommendations"
    if cache_key in cache_store:
        return cache_store[cache_key]
        
    async with httpx.AsyncClient() as client:
        import asyncio

        async def fetch_rawg_multi(params_base: dict, total: int = 50) -> list:
            """Fetch multiple pages from RAWG to reach ~total items."""
            all_items = []
            page = 1
            while len(all_items) < total:
                need = min(40, total - len(all_items))
                p = {**params_base, "page_size": need, "page": page}
                items = await fetch_rawg_list(client, p)
                if not items:
                    break
                all_items.extend(items)
                page += 1
                if page > 3:   # cap at 3 pages to avoid hammering
                    break
            # Deduplicate
            seen = set()
            deduped = []
            for item in all_items:
                key = (item.get("title") or "").lower().strip()
                if key and key not in seen:
                    seen.add(key)
                    deduped.append(item)
            return deduped[:total]

        tasks = {
            "trending_games": fetch_rawg_multi({"key": api_key, "ordering": "-rating", "dates": "2020-01-01,2026-05-30"}),
            "recently_released": fetch_rawg_multi({"key": api_key, "dates": "2025-10-01,2026-05-30", "ordering": "-added"}),
            "upcoming": fetch_rawg_multi({"key": api_key, "dates": "2026-06-01,2027-12-31", "ordering": "-added"}),
            "top_rpgs": fetch_rawg_multi({"key": api_key, "genres": "role-playing-games-rpg", "ordering": "-rating"}),
            "switch_hits": fetch_rawg_multi({"key": api_key, "platforms": "7", "ordering": "-rating"}),
            "action_hits": fetch_rawg_multi({"key": api_key, "genres": "action", "ordering": "-rating"}),
            "indie_hits": fetch_rawg_multi({"key": api_key, "genres": "indie", "ordering": "-rating"}),
            "strategy_hits": fetch_rawg_multi({"key": api_key, "genres": "strategy", "ordering": "-rating"}),
            "shooter_hits": fetch_rawg_multi({"key": api_key, "genres": "shooter", "ordering": "-rating"}),
            "puzzle_hits": fetch_rawg_multi({"key": api_key, "genres": "puzzle", "ordering": "-rating"}),
            "simulation_hits": fetch_rawg_multi({"key": api_key, "genres": "simulation", "ordering": "-rating"}),
            "adventure_hits": fetch_rawg_multi({"key": api_key, "genres": "adventure", "ordering": "-rating"}),
            "sports_hits": fetch_rawg_multi({"key": api_key, "genres": "sports", "ordering": "-rating"}),
            "horror_hits": fetch_rawg_multi({"key": api_key, "genres": "horror", "ordering": "-rating"}),
            "fighting_hits": fetch_rawg_multi({"key": api_key, "genres": "fighting", "ordering": "-rating"}),
            "top_pc": fetch_rawg_multi({"key": api_key, "platforms": "4", "ordering": "-rating"}),
            "top_ps5": fetch_rawg_multi({"key": api_key, "platforms": "187", "ordering": "-rating"}),
            "top_xbox": fetch_rawg_multi({"key": api_key, "platforms": "186", "ordering": "-rating"}),
        }

        keys = list(tasks.keys())
        results = await asyncio.gather(*[tasks[k] for k in keys])

        recommendations = {key: results[i] for i, key in enumerate(keys)}

        cache_store[cache_key] = recommendations
        return recommendations


@router.get("/trending")
async def get_trending_games(
    current_user = Depends(get_current_user)
):
    api_key = os.getenv("RAWG_API_KEY") or "e5b72dfeb6b349d4948a31e847c2b3e4"
    
    cache_key = "trending_games_100"
    if cache_key in cache_store:
        return cache_store[cache_key]
        
    parsed_items = []
    async with httpx.AsyncClient() as client:
        try:
            # We want to fetch 100 items. Let's fetch 3 pages of size 40.
            for page in range(1, 4):
                url = "https://api.rawg.io/api/games"
                params = {
                    "key": api_key,
                    "ordering": "-added",
                    "page_size": 40,
                    "page": page,
                    "dates": "2025-01-01,2026-05-30"
                }
                response = await client.get(url, params=params, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    for item in results:
                        parsed = parse_rawg_item(item)
                        if parsed["title"]:
                            parsed_items.append(parsed)
                else:
                    break
                    
            parsed_items = parsed_items[:100]
            cache_store[cache_key] = parsed_items
            return parsed_items
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


RAWG_GENRE_SLUGS = {
    "action": "action",
    "adventure": "adventure",
    "rpg": "role-playing-games-rpg",
    "role-playing": "role-playing-games-rpg",
    "role-playing game": "role-playing-games-rpg",
    "strategy": "strategy",
    "sports": "sports",
    "racing": "racing",
    "shooter": "shooter",
    "puzzle": "puzzle",
    "simulation": "simulation",
    "horror": "horror",
    "fighting": "fighting",
    "platformer": "platformer",
    "stealth": "stealth",
    "survival": "survival",
    "mmo": "massively-mutiplayer",
    "visual novel": "visual-novel",
    "indie": "indie"
}


@router.get("/similar")
async def get_similar_games(
    title: str = Query(...),
    current_user = Depends(get_current_user)
):
    api_key = os.getenv("RAWG_API_KEY") or "e5b72dfeb6b349d4948a31e847c2b3e4"
    
    # 1. Search for the game to find its ID and genres
    search_url = "https://api.rawg.io/api/games"
    async with httpx.AsyncClient() as client:
        try:
            search_res = await client.get(search_url, params={"key": api_key, "search": title, "page_size": 1}, timeout=10.0)
            if search_res.status_code != 200:
                return []
            search_data = search_res.json()
            results = search_data.get("results", [])
            if not results:
                return []
            
            game_id = results[0]["id"]
            genres = [g.get("slug") for g in results[0].get("genres", [])]
            
            # 2. Fetch suggested/similar games
            suggested_url = f"https://api.rawg.io/api/games/{game_id}/suggested"
            suggested_res = await client.get(suggested_url, params={"key": api_key, "page_size": 12}, timeout=10.0)
            
            if suggested_res.status_code == 200:
                suggested_data = suggested_res.json()
                suggested_results = suggested_data.get("results", [])
                if suggested_results:
                    parsed_items = []
                    for item in suggested_results:
                        parsed = parse_rawg_item(item)
                        if parsed["title"]:
                            parsed_items.append(parsed)
                    return parsed_items
            
            # Fallback (Business tier restriction on RAWG suggested endpoint)
            # Find games sharing similar genres
            if genres:
                genre_query = ",".join(genres[:2])
                games_res = await client.get(
                    "https://api.rawg.io/api/games",
                    params={
                        "key": api_key,
                        "genres": genre_query,
                        "page_size": 13,
                        "ordering": "-added"
                    },
                    timeout=10.0
                )
                if games_res.status_code == 200:
                    similar_data = games_res.json()
                    similar_results = similar_data.get("results", [])
                    parsed_items = []
                    for item in similar_results:
                        if item.get("id") != game_id:
                            parsed = parse_rawg_item(item)
                            if parsed["title"]:
                                parsed_items.append(parsed)
                    return parsed_items[:12]
                    
            return []
        except Exception as e:
            print(f"Error fetching similar games: {e}")
            return []


@router.get("/personalized-recommendations")
async def get_personalized_recommendations(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    api_key = os.getenv("RAWG_API_KEY") or "e5b72dfeb6b349d4948a31e847c2b3e4"
    
    # 1. Fetch user's game entries
    user_entries = db.query(GameEntry).filter(GameEntry.user_id == current_user.id).all()
    
    # Count genres with rating weights
    genre_counts = {}
    history_items = []
    for entry in user_entries:
        status = "Played & Reviewed" if entry.is_played else "Playlist (Wishlist)"
        rating_str = f"Rating: {entry.my_rating}/5" if entry.my_rating else "No rating"
        note = f"Note: {entry.reasons_for_liking}" if entry.reasons_for_liking else ""
        tags = f"Tags: {entry.tags}" if entry.tags else ""
        history_items.append(
            f"- Title: {entry.title} ({entry.platform}). Status: {status}. {rating_str}. Genres: {entry.genres}. {tags} {note}"
        )
        if entry.genres:
            weight = 3 if (entry.my_rating and entry.my_rating >= 4.0) else 1
            for g in entry.genres.split(", "):
                g_clean = g.strip().lower()
                genre_counts[g_clean] = genre_counts.get(g_clean, 0) + weight

    user_profile = "\n".join(history_items) if history_items else "User game library is currently empty. Recommending popular video games."
                
    # Get top genre slugs
    sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
    top_slugs = []
    for g_name, _ in sorted_genres[:2]:
        slug = RAWG_GENRE_SLUGS.get(g_name)
        if slug:
            top_slugs.append(slug)
            
    async with httpx.AsyncClient() as client:
        # Fetch candidate lists
        tasks = []
        if top_slugs:
            genre_query = ",".join(top_slugs)
            tasks.append(fetch_rawg_list(client, {
                "key": api_key,
                "genres": genre_query,
                "page_size": 20,
                "ordering": "-rating"
            }))
        
        # Always add trending/curated popular games to candidates pool
        tasks.append(fetch_rawg_list(client, {
            "key": api_key,
            "ordering": "-rating",
            "page_size": 20,
            "dates": "2020-01-01,2026-05-30"
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
            return await fetch_rawg_list(client, {
                "key": api_key,
                "ordering": "-rating",
                "page_size": 12,
                "dates": "2020-01-01,2026-05-30"
            })
            
        # Call Groq recommender
        from app.services.ai import call_groq_recommender
        return await call_groq_recommender(user_profile, candidates)


@router.get("/details")
async def get_game_details(
    title: Optional[str] = Query(None),
    rawg_id: Optional[int] = Query(None),
    current_user = Depends(get_current_user)
):
    api_key = os.getenv("RAWG_API_KEY") or "e5b72dfeb6b349d4948a31e847c2b3e4"
    
    async with httpx.AsyncClient() as client:
        try:
            game_id = rawg_id
            
            # If ID is not provided, search by title first
            if not game_id and title:
                search_url = "https://api.rawg.io/api/games"
                search_res = await client.get(search_url, params={"key": api_key, "search": title, "page_size": 1}, timeout=10.0)
                if search_res.status_code == 200:
                    search_data = search_res.json()
                    results = search_data.get("results", [])
                    if results:
                        game_id = results[0]["id"]
            
            if not game_id:
                return {"description": "No description available."}
                
            details_url = f"https://api.rawg.io/api/games/{game_id}"
            details_res = await client.get(details_url, params={"key": api_key}, timeout=10.0)
            if details_res.status_code == 200:
                details_data = details_res.json()
                description = details_data.get("description_raw") or details_data.get("description") or "No description available."
                return {
                    "description": description,
                    "background_image_additional": details_data.get("background_image_additional"),
                    "website": details_data.get("website"),
                    "developers": ", ".join([d.get("name") for d in details_data.get("developers", [])])
                }
            return {"description": "No description available."}
        except Exception as e:
            print(f"Error fetching game details (title={title}, id={rawg_id}): {e}")
            return {"description": f"Failed to load description: {str(e)}"}
