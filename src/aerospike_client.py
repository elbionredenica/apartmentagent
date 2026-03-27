from typing import Optional, Dict, Any
from src.config import settings
import time

class AerospikeClient:
    """
    Stub Aerospike client for hackathon.
    In production, this would connect to Aerospike for hot-path caching.
    For now, we'll use Ghost (Postgres) for everything.
    """
    def __init__(self):
        self.client = None
        self.namespace = settings.aerospike_namespace
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    def connect(self):
        """Connect to Aerospike cluster (stub)"""
        print("⚠️  Aerospike disabled for hackathon - using in-memory cache")
    
    def disconnect(self):
        """Close Aerospike connection (stub)"""
        pass
    
    def exists(self, set_name: str, key: str) -> bool:
        """Check if key exists"""
        cache_key = f"{set_name}:{key}"
        return cache_key in self._cache
    
    def put(self, set_name: str, key: str, data: Dict[str, Any], ttl: int = 86400):
        """Store data with TTL (default 24 hours)"""
        cache_key = f"{set_name}:{key}"
        self._cache[cache_key] = data
    
    def get(self, set_name: str, key: str) -> Optional[Dict[str, Any]]:
        """Get data by key"""
        cache_key = f"{set_name}:{key}"
        return self._cache.get(cache_key)
    
    def update(self, set_name: str, key: str, data: Dict[str, Any]):
        """Update existing record"""
        cache_key = f"{set_name}:{key}"
        if cache_key in self._cache:
            self._cache[cache_key].update(data)
        else:
            self._cache[cache_key] = data
    
    def delete(self, set_name: str, key: str):
        """Delete record"""
        cache_key = f"{set_name}:{key}"
        if cache_key in self._cache:
            del self._cache[cache_key]
    
    def add_lock(self, set_name: str, key: str, ttl: int = 300) -> bool:
        """
        Atomic add operation for distributed locking.
        Returns True if lock acquired, False if already exists.
        """
        cache_key = f"{set_name}:{key}"
        if cache_key in self._cache:
            return False
        self._cache[cache_key] = {"locked": True, "timestamp": time.time()}
        return True

# Global Aerospike instance
aerospike_client = AerospikeClient()
