from fastapi import APIRouter, Depends, HTTPException, Query
import httpx
import os
from typing import List

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
        "poster_url": poster_url
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
        # Fetch curated popular categories
        popular_params = {
            "key": api_key,
            "ordering": "-rating",
            "page_size": 10,
            "dates": "2020-01-01,2026-05-30"
        }
        
        rpg_params = {
            "key": api_key,
            "genres": "role-playing-games-rpg",
            "page_size": 10
        }
        
        switch_params = {
            "key": api_key,
            "platforms": "7",
            "page_size": 10
        }
        
        action_params = {
            "key": api_key,
            "genres": "action",
            "page_size": 10
        }

        recommendations = {
            "trending_games": await fetch_rawg_list(client, popular_params),
            "top_rpgs": await fetch_rawg_list(client, rpg_params),
            "switch_hits": await fetch_rawg_list(client, switch_params),
            "action_hits": await fetch_rawg_list(client, action_params)
        }
        
        cache_store[cache_key] = recommendations
        return recommendations
