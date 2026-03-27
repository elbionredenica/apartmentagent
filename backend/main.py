from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
import os
from dotenv import load_dotenv
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

app = FastAPI(title="ApartmentAgent API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth0 configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_API_AUDIENCE = os.getenv("AUTH0_API_AUDIENCE")
AUTH0_ISSUER = os.getenv("AUTH0_ISSUER")
ALGORITHMS = ["RS256"]

security = HTTPBearer()

# Database connection
def get_db():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    try:
        yield conn
    finally:
        conn.close()

# Auth0 token verification
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    
    try:
        # Get Auth0 public key
        jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            jwks_response = await client.get(jwks_url)
            jwks = jwks_response.json()
        
        # Decode and verify token
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        
        if rsa_key:
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=ALGORITHMS,
                audience=AUTH0_API_AUDIENCE,
                issuer=AUTH0_ISSUER
            )
            return payload
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find appropriate key"
        )
    
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

@app.get("/")
async def root():
    return {
        "message": "ApartmentAgent API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "listings": "/api/listings (protected)",
            "transcripts": "/api/transcripts (protected)",
            "viewings": "/api/viewings (protected)"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/listings")
async def get_listings(
    user=Depends(verify_token),
    conn=Depends(get_db)
):
    """Get all listings for the authenticated user"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get user_id from Auth0 sub
    auth0_sub = user.get("sub")
    
    cursor.execute("""
        SELECT l.*, uls.status, uls.failure_reason
        FROM listings l
        LEFT JOIN user_listing_states uls ON l.id = uls.listing_id
        LEFT JOIN users u ON uls.user_id = u.id
        WHERE u.email = %s OR uls.user_id IS NULL
        ORDER BY l.first_seen_at DESC
        LIMIT 50
    """, (user.get("email"),))
    
    listings = cursor.fetchall()
    cursor.close()
    
    return {"listings": listings}

@app.get("/api/transcripts")
async def get_transcripts(
    user=Depends(verify_token),
    conn=Depends(get_db)
):
    """Get all call transcripts for the authenticated user"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT ct.*, l.address, l.rent
        FROM call_transcripts ct
        JOIN listings l ON ct.listing_id = l.id
        JOIN users u ON ct.user_id = u.id
        WHERE u.email = %s
        ORDER BY ct.called_at DESC
        LIMIT 50
    """, (user.get("email"),))
    
    transcripts = cursor.fetchall()
    cursor.close()
    
    return {"transcripts": transcripts}

@app.get("/api/viewings")
async def get_viewings(
    user=Depends(verify_token),
    conn=Depends(get_db)
):
    """Get all scheduled viewings for the authenticated user"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT v.*, l.address, l.rent, l.bedrooms
        FROM viewings v
        JOIN listings l ON v.listing_id = l.id
        JOIN users u ON v.user_id = u.id
        WHERE u.email = %s
        ORDER BY v.scheduled_at DESC
    """, (user.get("email"),))
    
    viewings = cursor.fetchall()
    cursor.close()
    
    return {"viewings": viewings}

@app.get("/api/user/profile")
async def get_user_profile(
    user=Depends(verify_token),
    conn=Depends(get_db)
):
    """Get user profile and preferences"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT * FROM users WHERE email = %s
    """, (user.get("email"),))
    
    profile = cursor.fetchone()
    cursor.close()
    
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    return {"profile": profile}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
