import httpx
import os
import json
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
