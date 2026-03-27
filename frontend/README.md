# ApartmentAgent Frontend

Next.js frontend with Auth0 authentication and Google Calendar OAuth integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env.local`

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Features

- Auth0 login/logout
- Google Calendar OAuth (for booking viewings)
- Protected routes
- User session management
- JWT token handling

## Auth0 Configuration

- Domain: `dev-vlw1rkf5cvbq568a.us.auth0.com`
- Client ID: Configured in `.env.local`
- Callback URL: `http://localhost:3000/api/auth/callback`

## Routes

- `/` - Home page (login or dashboard)
- `/auth/login` - Login
- `/auth/logout` - Logout
- `/auth/callback` - OAuth callback
- `/auth/profile` - User profile JSON
- `/auth/access-token` - Access token

## Next Steps

- Connect to backend API
- Build listings dashboard
- Add transcript viewer
- Implement viewing scheduler
