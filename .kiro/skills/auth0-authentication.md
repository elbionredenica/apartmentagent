# Auth0 Authentication for Multi-Tenant Agent System

## Installation via Agent Skills

Auth0 provides production-ready agent skills for implementing authentication:

```bash
# Install Auth0 agent skills
npx skills add auth0/agent-skills
```

This installs two skill sets:
1. **Auth0 Core Skills**: Quickstarts, migrations, MFA patterns
2. **Auth0 SDK Skills**: Framework-specific implementations

## Available Skills

### Core Skills
- `auth0-quickstart`: Framework detection and intelligent routing
- `auth0-migration`: Migration guidance from other auth solutions
- `auth0-mfa`: Multi-factor authentication patterns

### Framework Skills
- `auth0-react`: React SPA with Vite or CRA
- `auth0-nextjs`: Next.js App Router and Pages Router
- `auth0-vue`: Vue.js 3 applications
- `auth0-angular`: Angular 12+ with route guards
- `auth0-nuxt`: Nuxt 3/4 with composables
- `auth0-express`: Express.js server-rendered apps
- `auth0-react-native`: React Native and Expo

## For ApartmentAgent

We'll use Auth0 for:
1. **User Authentication**: Secure login for apartment seekers
2. **Calendar OAuth**: Access to Google Calendar/Outlook for booking
3. **Multi-Tenant API Security**: Isolate user data across the platform

## Implementation Pattern

### 1. User Authentication (Express Backend)

```javascript
// Install SDK
npm install express-openid-connect

// Configure Auth0
const { auth } = require('express-openid-connect');

app.use(auth({
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_DOMAIN
}));

// Protected route
app.get('/profile', requiresAuth(), (req, res) => {
  res.json(req.oidc.user);
});
```

### 2. Calendar OAuth Integration

```javascript
// Request calendar access during login
app.get('/login', (req, res) => {
  res.oidc.login({
    authorizationParams: {
      audience: 'https://www.googleapis.com/auth/calendar',
      scope: 'openid profile email https://www.googleapis.com/auth/calendar'
    }
  });
});

// Use access token to create calendar events
async function createViewing(userId, listing) {
  const user = await getUserWithTokens(userId);
  
  const event = {
    summary: `Apartment Viewing: ${listing.address}`,
    description: `Score: ${listing.overall_score}\nLandlord: ${listing.phone}`,
    start: { dateTime: findAvailableSlot(user.calendar) },
    end: { dateTime: addMinutes(start, 30) }
  };
  
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${user.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  
  return response.json();
}
```

### 3. Multi-Tenant API Security

```javascript
// Middleware to ensure users only access their data
function requiresUserOwnership(req, res, next) {
  const requestedUserId = req.params.userId;
  const authenticatedUserId = req.oidc.user.sub;
  
  if (requestedUserId !== authenticatedUserId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
}

// Protected endpoints
app.get('/api/users/:userId/listings', requiresAuth(), requiresUserOwnership, async (req, res) => {
  const listings = await getListingsForUser(req.params.userId);
  res.json(listings);
});

app.get('/api/users/:userId/transcripts', requiresAuth(), requiresUserOwnership, async (req, res) => {
  const transcripts = await getTranscriptsForUser(req.params.userId);
  res.json(transcripts);
});
```

### 4. Token Management

```javascript
// Store tokens securely in Ghost database
async function storeUserTokens(userId, tokens) {
  await db.query(`
    INSERT INTO user_auth_tokens (user_id, access_token, refresh_token, expires_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      access_token = $2,
      refresh_token = $3,
      expires_at = $4
  `, [userId, tokens.access_token, tokens.refresh_token, tokens.expires_at]);
}

// Refresh tokens when expired
async function getValidAccessToken(userId) {
  const tokens = await getUserTokens(userId);
  
  if (Date.now() >= tokens.expires_at) {
    const refreshed = await refreshAccessToken(tokens.refresh_token);
    await storeUserTokens(userId, refreshed);
    return refreshed.access_token;
  }
  
  return tokens.access_token;
}
```

## Security Best Practices

### 1. Environment Variables
```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_SECRET=long_random_string_for_session_encryption
BASE_URL=http://localhost:3000
```

### 2. Scopes
Request only necessary scopes:
- `openid profile email`: Basic user info
- `https://www.googleapis.com/auth/calendar`: Calendar access
- `offline_access`: Refresh tokens for long-lived access

### 3. Token Storage
- Never store tokens in localStorage (XSS vulnerability)
- Use HTTP-only cookies for session management
- Store OAuth tokens encrypted in database
- Implement token rotation

### 4. API Security
- Always validate JWT tokens on API endpoints
- Use Auth0's middleware for automatic validation
- Implement rate limiting per user
- Log all authentication events

## Hackathon Implementation

For the 8-hour hackathon, focus on:

1. **Basic Auth**: User login/logout with Auth0
2. **Calendar OAuth**: Request calendar access during signup
3. **Protected API**: One endpoint that requires authentication
4. **Demo User**: Pre-configured test user for judges

Skip for hackathon:
- Password reset flows
- Email verification
- Social login providers
- Advanced MFA

## Resources

- Auth0 Agent Skills: https://auth0.com/docs/quickstart/agent-skills
- GitHub: https://github.com/auth0/agent-skills
- Express SDK: https://github.com/auth0/express-openid-connect
- Calendar API: https://developers.google.com/calendar/api
