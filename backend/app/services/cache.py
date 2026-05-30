from datetime import datetime, timedelta
from typing import Any, Dict, Optional

class MemoryCache:
    def __init__(self):
        # Format: key -> {"value": data, "expires_at": datetime}
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if not entry:
            return None
        
        # Check expiration
        if datetime.utcnow() > entry["expires_at"]:
            del self._cache[key]
            return None
            
        return entry["value"]

    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        self._cache[key] = {
            "value": value,
            "expires_at": expires_at
        }

    def clear(self) -> None:
        self._cache.clear()

# Global cache instance
cache_store = MemoryCache()
