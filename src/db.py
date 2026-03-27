import psycopg
from psycopg_pool import AsyncConnectionPool
from typing import Optional
from src.config import settings

class Database:
    def __init__(self):
        self.pool: Optional[AsyncConnectionPool] = None
    
    async def connect(self):
        """Create connection pool to Ghost database"""
        self.pool = AsyncConnectionPool(
            settings.ghost_connection_string,
            min_size=2,
            max_size=10,
            open=True
        )
        print("✅ Connected to Ghost database")
    
    async def disconnect(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
            print("👋 Disconnected from Ghost database")
    
    async def execute(self, query: str, *args):
        """Execute a query"""
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, args)
                return cur.statusmessage
    
    async def fetch(self, query: str, *args):
        """Fetch multiple rows"""
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, args)
                return await cur.fetchall()
    
    async def fetchrow(self, query: str, *args):
        """Fetch single row"""
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, args)
                return await cur.fetchone()
    
    async def fetchval(self, query: str, *args):
        """Fetch single value"""
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, args)
                row = await cur.fetchone()
                return row[0] if row else None

# Global database instance
db = Database()
