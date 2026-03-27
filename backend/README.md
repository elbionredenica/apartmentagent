# ApartmentAgent Backend API

FastAPI backend with Auth0 JWT authentication and PostgreSQL database.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Environment variables are configured in `.env`

4. Run the server:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

### Public
- `GET /` - API info
- `GET /health` - Health check

### Protected (require Auth0 JWT)
- `GET /api/listings` - Get user's listings
- `GET /api/transcripts` - Get call transcripts
- `GET /api/viewings` - Get scheduled viewings
- `GET /api/user/profile` - Get user profile

## Authentication

All `/api/*` endpoints require a valid Auth0 JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The token is automatically sent by the Next.js frontend when the user is logged in.

## Database

Connected to Ghost/Timescale Postgres database with schema defined in `schema.sql`.

## Next Steps

- Add POST endpoints for creating preferences
- Add webhook endpoint for Bland AI callbacks
- Implement calendar booking logic
- Add LangGraph orchestrator integration
