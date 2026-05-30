import httpx
import os
import json
import re
from typing import List

async def call_groq_recommender(user_profile: str, candidates: List[dict]) -> List[dict]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("GROQ_API_KEY not configured, using default order.")
        return candidates[:12]
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    candidate_lines = []
    for i, c in enumerate(candidates):
        candidate_lines.append(f"{i}: Title: {c['title']}, Genres: {c['genres']}, Synopsis: {c.get('synopsis', '')}")
    candidates_str = "\n".join(candidate_lines)
    
    prompt = f"""
You are an expert personalized recommendations AI.
We have a user with the following watch/play library history and preferences:
{user_profile}

Here is a list of candidate recommendations:
{candidates_str}

Select and rank the top 12 candidate recommendations that match the user's preferences best.
Return ONLY a JSON list of integer indices representing the chosen candidates in order of recommendation, from best to worst.
Example response: [3, 0, 5, 2, 8]
Do not return any other text, markdown formatting, or explanations. Return just the JSON array.
"""
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()
                
                # Handle possible markdown formatting (e.g. ```json ... ```)
                if content.startswith("```"):
                    lines = content.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines[-1].startswith("```"):
                        lines = lines[:-1]
                    content = "\n".join(lines).strip()
                
                try:
                    indices = json.loads(content)
                    if isinstance(indices, dict):
                        for val in indices.values():
                            if isinstance(val, list):
                                indices = val
                                break
                    if isinstance(indices, list):
                        ranked_candidates = []
                        seen_titles = set()
                        for idx in indices:
                            if isinstance(idx, int) and 0 <= idx < len(candidates):
                                candidate = candidates[idx]
                                title_key = candidate["title"].lower().strip()
                                if title_key not in seen_titles:
                                    seen_titles.add(title_key)
                                    ranked_candidates.append(candidate)
                                    
                        # Fill up remaining if less than 12
                        for c in candidates:
                            title_key = c["title"].lower().strip()
                            if title_key not in seen_titles:
                                seen_titles.add(title_key)
                                ranked_candidates.append(c)
                                
                        print(f"Groq AI recommendations successfully ranked {len(ranked_candidates)} items.")
                        return ranked_candidates[:12]
                except Exception as parse_err:
                    print("Failed to parse Groq response content:", content, parse_err)
            else:
                print("Groq API returned error status:", response.status_code, response.text)
        except Exception as e:
            print("Error calling Groq API:", e)
            
    return candidates[:12]


# --- Robust JSON Parsing Helpers ---

def clean_json_string(s: str) -> str:
    # Remove trailing commas in JSON arrays and objects
    s = re.sub(r',\s*([\]}])', r'\1', s)
    return s

def clean_bracket_mismatch(s: str) -> str:
    s = s.strip()
    if not s:
        return s
    
    # Case 1: Starts with '[' and ends with ']}' (extra closing brace)
    if s.startswith('[') and s.endswith(']}'):
        if s.count('{') == s.count('}') - 1:
            s = s[:-1].strip()
            
    # Case 2: Starts with '{' but ends with ']' (missing closing brace, or extra square bracket)
    elif s.startswith('{') and s.endswith(']'):
        if s.count('[') == s.count(']') - 1:
            s = s[:-1].strip()
        elif s.count('{') == s.count('}') + 1:
            s = (s + '}').strip()
            
    # Case 3: Ends with '}' but missing outer '{'
    elif not s.startswith('{') and s.endswith('}') and s.count('{') == s.count('}') - 1:
        first_key = min([pos for pos in [s.find('"message"'), s.find('"recommendations"')] if pos != -1], default=-1)
        if first_key != -1:
            s = '{' + s
            
    return s

def normalize_chatbot_data(data, app_mode: str) -> dict:
    if isinstance(data, list):
        return {
            "message": "Here are some recommendations based on your request:",
            "recommendations": data
        }
    
    if isinstance(data, dict):
        message = data.get("message", "")
        
        # Look for the list of recommendations
        recs = data.get("recommendations", None)
        if not isinstance(recs, list):
            recs = None
            # Search for any key that contains a list
            for k, v in data.items():
                if k != "message" and isinstance(v, list):
                    recs = v
                    break
            if recs is None:
                recs = []
                
        # If recommendations are strings (just titles) or missing category, normalize them
        clean_recs = []
        for item in recs:
            if isinstance(item, dict):
                clean_recs.append(item)
            elif isinstance(item, str):
                clean_recs.append({
                    "title": item,
                    "category": "Game" if app_mode == "gamecorn" else "Movie"
                })
        
        return {
            "message": message or "Here are some recommendations based on your request:",
            "recommendations": clean_recs
        }
        
    return {
        "message": str(data),
        "recommendations": []
    }

def parse_chatbot_response(content: str, app_mode: str) -> dict:
    content_stripped = content.strip()
    
    # 1. Strip top-level markdown block tags if present
    if content_stripped.startswith("```"):
        lines = content_stripped.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        content_stripped = "\n".join(lines).strip()
        
    # 2. Fix minor bracket mismatches
    content_stripped = clean_bracket_mismatch(content_stripped)

    # 3. Try parsing the whole content first (it might be clean JSON)
    try:
        data = json.loads(content_stripped)
        return normalize_chatbot_data(data, app_mode)
    except Exception:
        pass

    try:
        data = json.loads(clean_json_string(content_stripped))
        return normalize_chatbot_data(data, app_mode)
    except Exception:
        pass

    # 4. Try extracting JSON from curly braces {}
    first_curly = content_stripped.find('{')
    last_curly = content_stripped.rfind('}')
    if first_curly != -1 and last_curly != -1 and last_curly > first_curly:
        json_str = content_stripped[first_curly:last_curly+1]
        try:
            json_str = clean_bracket_mismatch(json_str)
            cleaned_json = clean_json_string(json_str)
            data = json.loads(cleaned_json)
            normalized = normalize_chatbot_data(data, app_mode)
            
            # Extract text prefix and suffix
            if normalized.get("message") in [None, "", "Here are some recommendations based on your request:"]:
                prefix = content_stripped[:first_curly].strip()
                suffix = content_stripped[last_curly+1:].strip()
                msg_parts = []
                if prefix:
                    prefix_clean = prefix.rstrip(":` \n\t")
                    if prefix_clean:
                        msg_parts.append(prefix_clean)
                if suffix:
                    suffix_clean = suffix.lstrip(":` \n\t")
                    if suffix_clean:
                        msg_parts.append(suffix_clean)
                if msg_parts:
                    normalized["message"] = "\n\n".join(msg_parts)
            return normalized
        except Exception:
            pass

    # 5. Try extracting JSON from square brackets []
    first_square = content_stripped.find('[')
    last_square = content_stripped.rfind(']')
    if first_square != -1 and last_square != -1 and last_square > first_square:
        json_str = content_stripped[first_square:last_square+1]
        try:
            json_str = clean_bracket_mismatch(json_str)
            cleaned_json = clean_json_string(json_str)
            data = json.loads(cleaned_json)
            normalized = normalize_chatbot_data(data, app_mode)
            
            # Extract text prefix and suffix
            prefix = content_stripped[:first_square].strip()
            suffix = content_stripped[last_square+1:].strip()
            msg_parts = []
            if prefix:
                prefix_clean = prefix.rstrip(":` \n\t")
                if prefix_clean:
                    msg_parts.append(prefix_clean)
            if suffix:
                suffix_clean = suffix.lstrip(":` \n\t")
                if suffix_clean:
                    msg_parts.append(suffix_clean)
            if msg_parts:
                normalized["message"] = "\n\n".join(msg_parts)
            return normalized
        except Exception:
            pass

    # Fallback: treat the whole thing as a text message
    return {
        "message": content,
        "recommendations": []
    }


# --- AI Chatbot Service ---

async def search_tmdb_item(query: str):
    from app.routers.tmdb import parse_tmdb_item
    api_key = os.getenv("TMDB_API_KEY") or "a88ceb5966b80295efceb4520b7f61c4"
    url = "https://api.themoviedb.org/3/search/multi"
    params = {
        "api_key": api_key,
        "query": query,
        "language": "en-US",
        "page": 1
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=5.0)
            if response.status_code == 200:
                results = response.json().get("results", [])
                valid = [r for r in results if r.get("media_type") in ["movie", "tv"]]
                if valid:
                    return parse_tmdb_item(valid[0])
        except Exception as e:
            print(f"Error searching TMDB item for chatbot ({query}): {e}")
    return None

async def search_rawg_item(query: str):
    import re
    from app.routers.rawg import parse_rawg_item
    api_key = os.getenv("RAWG_API_KEY") or "e5b72dfeb6b349d4948a31e847c2b3e4"
    url = "https://api.rawg.io/api/games"
    params = {
        "key": api_key,
        "search": query,
        "page_size": 1
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=5.0)
            if response.status_code == 200:
                results = response.json().get("results", [])
                if results:
                    return parse_rawg_item(results[0])
        except Exception as e:
            print(f"Error searching RAWG item for chatbot ({query}): {e}")
    return None

async def call_groq_chatbot(user_profile: str, messages: List[dict], app_mode: str) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {
            "message": "AI Assistant is not fully configured (GROQ_API_KEY missing).",
            "recommendations": []
        }

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    mode_name = "GameCorn (Gaming playlist tracker)" if app_mode == "gamecorn" else "Popcorn (Movie & TV series watchlist tracker)"
    category_options = "'Game'" if app_mode == "gamecorn" else "'Movie', 'Series', 'Anime Movie', 'Anime Series'"

    system_prompt = f"""You are PopcornAI, a friendly chatbot and personalized recommender for the Popcorn/GameCorn application.
The user is currently browsing in {mode_name} mode.
Here is the user's library and preferences context (Full Session watchlist/playlist data):
{user_profile}

Help the user find new titles, discuss their favorite items, answer questions, or chat about films, series, or games.
When recommending titles, please list up to 4 recommendations.
You must return your response as a valid JSON object matching this schema:
{{
  "message": "Write your friendly, markdown-formatted conversational chat response here...",
  "recommendations": [
    {{
      "title": "Exact Title of Recommended Movie/Show/Game",
      "category": "Movie"
    }}
  ]
}}
Rules:
- "message" can contain standard markdown formatting (e.g. bold, bullet points, numbered lists, italics). Use markdown generously to make it look professional and highly readable!
- "recommendations" should be empty if the user is just saying hello or asking general questions. Only suggest items when the user asks for recommendations, shares what they are in the mood for, or when it naturally fits the conversation.
- For GameCorn mode, set the category of recommendations to 'Game'. For Popcorn mode, choose from: {category_options}.
- Return ONLY the JSON object. Do not wrap it in markdown block tags (like ```json ... ```) or add any other text outside the JSON. Return just the JSON object.
"""

    payload_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        payload_messages.append({"role": msg["role"], "content": msg["content"]})

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": payload_messages,
        "temperature": 0.5,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=12.0)
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()
                
                parsed_data = parse_chatbot_response(content, app_mode)
                raw_recs = parsed_data.get("recommendations", [])
                enriched_recs = []

                try:
                    import asyncio
                    search_tasks = []
                    for rec in raw_recs:
                        title = rec.get("title")
                        if not title:
                            continue
                        if app_mode == "gamecorn":
                            search_tasks.append(search_rawg_item(title))
                        else:
                            search_tasks.append(search_tmdb_item(title))

                    search_results = []
                    if search_tasks:
                        search_results = await asyncio.gather(*search_tasks)

                    for idx, s_res in enumerate(search_results):
                        original_rec = raw_recs[idx]
                        if s_res:
                            enriched_recs.append(s_res)
                        else:
                            enriched_recs.append({
                                "title": original_rec.get("title"),
                                "category": original_rec.get("category", "Game" if app_mode == "gamecorn" else "Movie"),
                                "rating": 3.0,
                                "synopsis": "Recommended by AI",
                                "genres": "AI Recommended",
                                "poster_url": None
                            })
                except Exception as enrich_err:
                    print("Failed to enrich recommendations:", enrich_err)
                    # Use raw recommendations without enrichment
                    enriched_recs = []
                    for rec in raw_recs:
                        title = rec.get("title")
                        if title:
                            enriched_recs.append({
                                "title": title,
                                "category": rec.get("category", "Game" if app_mode == "gamecorn" else "Movie"),
                                "rating": 3.0,
                                "synopsis": "Recommended by AI",
                                "genres": "AI Recommended",
                                "poster_url": None
                            })

                return {
                    "message": parsed_data.get("message", "Here are some recommendations:"),
                    "recommendations": enriched_recs
                }
            else:
                print("Groq Chatbot API returned error status:", response.status_code, response.text)
                return {
                    "message": "Sorry, I am having trouble connecting to the AI brain right now.",
                    "recommendations": []
                }
        except Exception as e:
            print("Error calling Groq Chatbot API:", e)
            return {
                "message": "Sorry, I ran into an error trying to process your message.",
                "recommendations": []
            }
