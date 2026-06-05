# Discord OAuth Integration

This document describes the Discord OAuth2 integration implementation for the TeachLink authentication flow.

## Overview

The Discord OAuth integration allows users to authenticate using their Discord account, providing a seamless signup/login experience.

## Features

- **OAuth2 Flow**: Implements the standard Discord OAuth2 authorization code flow
- **Security**: Uses state parameter to prevent CSRF attacks
- **Email Verification**: Requires Discord accounts to have verified emails
- **Avatar Support**: Fetches and displays user avatars from Discord
- **Edge Runtime**: Optimized for Edge deployment for fast performance

## Architecture

### Components

1. **OAuth Utilities** (`src/lib/discord/oauth.ts`)

   - `getDiscordAuthUrl()`: Generates Discord authorization URL
   - `exchangeCodeForToken()`: Exchanges authorization code for access token
   - `getDiscordUser()`: Fetches user information from Discord
   - `getDiscordAvatarUrl()`: Generates avatar URL with fallback
   - `generateState()`: Generates random state for CSRF protection

2. **API Routes**

   - `GET /api/auth/discord`: Initiates OAuth flow
   - `GET /api/auth/discord/callback`: Handles OAuth callback

3. **UI Components**
   - `DiscordButton`: Reusable button component for Discord auth
   - Updated login/signup pages with Discord button

### Flow Diagram

```
User clicks Discord button
    ↓
GET /api/auth/discord
    ↓
Generate state, set cookie, redirect to Discord
    ↓
User authorizes on Discord
    ↓
Discord redirects to callback with code
    ↓
GET /api/auth/discord/callback
    ↓
Validate state, exchange code for token
    ↓
Fetch user info from Discord
    ↓
Create/update user session
    ↓
Return auth response
```

## Configuration

Add the following environment variables to your `.env` file:

```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
```

### Getting Discord OAuth Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Navigate to "OAuth2" → "General"
4. Copy the Client ID and generate a Client Secret
5. Add your redirect URI under "Redirects"
6. Save the credentials in your environment variables

### Production Redirect URI

For production, use your actual domain:

```env
DISCORD_REDIRECT_URI=https://yourdomain.com/api/auth/discord/callback
```

## Security Considerations

1. **CSRF Protection**: State parameter is stored in httpOnly cookie and validated on callback
2. **HTTPS Required**: In production, always use HTTPS for OAuth callbacks
3. **Secret Management**: Never commit Discord secrets to version control
4. **Email Verification**: Only accepts Discord accounts with verified emails
5. **Rate Limiting**: All OAuth endpoints are rate-limited

## API Reference

### GET /api/auth/discord

Initiates Discord OAuth flow.

**Response:** Redirect to Discord authorization page

**Cookie:** Sets `discord_oauth_state` for CSRF protection

### GET /api/auth/discord/callback

Handles Discord OAuth callback.

**Query Parameters:**

- `code`: Authorization code from Discord
- `state`: State parameter for CSRF validation
- `error`: OAuth error (if any)

**Response:**

```json
{
  "message": "Discord authentication successful",
  "user": {
    "id": "user_id",
    "name": "username",
    "email": "user@example.com",
    "avatar": "avatar_url",
    "provider": "discord",
    "providerId": "discord_user_id"
  },
  "token": "jwt_token"
}
```

**Error Responses:**

- `400`: Invalid parameters, unverified email, or OAuth error
- `500`: Internal server error

## Testing

### Unit Tests

Test OAuth utility functions:

```bash
pnpm test src/lib/discord/__tests__/oauth.test.ts
```

### Integration Tests

Test API routes:

```bash
pnpm test src/app/api/auth/discord/__tests__/route.test.ts
pnpm test src/app/api/auth/discord/callback/__tests__/route.test.ts
```

### E2E Tests

Test complete OAuth flow:

```bash
pnpm test:e2e e2e/auth/discord.spec.ts
```

## Future Enhancements

- [ ] Implement token refresh logic
- [ ] Add Discord role-based access control
- [ ] Store Discord tokens for API integrations
- [ ] Add Discord guild membership verification
- [ ] Implement account linking (multiple OAuth providers)

## Troubleshooting

### Common Issues

1. **"Discord OAuth configuration is missing"**

   - Ensure all environment variables are set
   - Check that variables are loaded in the Edge runtime

2. **"Invalid state parameter"**

   - Clear cookies and try again
   - Ensure state cookie is being set correctly

3. **"Discord email must be verified"**

   - User must verify their email on Discord first
   - Cannot use Discord accounts without verified email

4. **Callback URL mismatch**
   - Ensure redirect URI matches exactly what's configured in Discord Developer Portal
   - Check for trailing slashes or protocol differences (http vs https)

## Related Documentation

- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [Next.js Edge Runtime](https://nextjs.org/docs/pages/building-your-application/rendering/edge-runtime)
- [Authentication Flow Documentation](./AUTHENTICATION_FLOW.md)
