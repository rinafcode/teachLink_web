# Auth & Session API

Base path: `/auth`

## Overview

The auth API uses a two-step challenge–response flow to authenticate a Stellar wallet. The client first requests a nonce, signs a message derived from that nonce, and submits the signature to verify ownership of the wallet address. On success a JWT is issued and the device is registered (or updated) in the database.

## Rate Limiting

Both endpoints are rate-limited per client IP using Redis-backed counters so the budget is shared across all gateway nodes.

| Endpoint | Limiter key | Identifier |
|----------|-------------|------------|
| `POST /auth/challenge` | `auth_challenge` | Client IP |
| `POST /auth/verify` | `auth_verify` | Client IP |

---

## `POST /auth/challenge`

Issues a nonce that the client must sign to prove wallet ownership.

- **Auth:** None
- **Rate limiter:** `challengeLimiter`

### Request Body

```json
{
  "walletAddress": "GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF123456"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `walletAddress` | `string` | Stellar public key (G… prefix). |

### Responses

#### `200 OK`

```json
{
  "message": "Sign in to Clicked\nWallet: GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF123456\nNonce: abc123def456",
  "nonce": "abc123def456"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `message` | `string` | The message the client must sign with their Stellar keypair. |
| `nonce` | `string` | The server-issued nonce (single-use, time-bound). |

#### `400 Bad Request`

Returned by the `validate` middleware when `walletAddress` is missing or empty.

```json
{
  "error": "walletAddress is required"
}
```

#### `429 Too Many Requests`

Returned by `challengeLimiter` when the IP exceeds its rate-limit budget.

```json
{
  "error": "Too many requests"
}
```

---

## `POST /auth/verify`

Verifies the signed message, upserts the user + wallet, registers (or updates) the device, and returns a JWT.

- **Auth:** None (the signature itself is the proof)
- **Rate limiter:** `verifyLimiter`

### Request Body

```json
{
  "walletAddress": "GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF123456",
  "signature": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "nonce": "abc123def456",
  "identityPublicKey": "base64-encoded-44-byte-ed25519-spki-der==",
  "device": {
    "deviceName": "My Browser",
    "platform": "web",
    "identityPublicKey": "base64-encoded-44-byte-ed25519-spki-der==",
    "registrationId": 1,
    "capabilities": ["sealed_box", "x3dh"]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletAddress` | `string` | Yes | Stellar public key (G… prefix). |
| `signature` | `string` | Yes | Hex or base64 signature of the challenge message. |
| `nonce` | `string` | Yes | The nonce previously obtained from `/auth/challenge`. |
| `identityPublicKey` | `string` | Yes | Base64-encoded Ed25519 SPKI DER identity public key (44 bytes). |
| `device` | `object` | Yes | Device registration details. |
| `device.deviceName` | `string` | Yes | Human-readable device name (1–100 chars). |
| `device.platform` | `string` | Yes | One of `"web"`, `"ios"`, `"android"`. |
| `device.identityPublicKey` | `string` | Yes | Must match the top-level `identityPublicKey`. |
| `device.registrationId` | `number` | No | Non-negative integer for push notification routing. |
| `device.capabilities` | `string[]` | No | Supported protocols (e.g. `["sealed_box"]`, `["sealed_box", "x3dh"]`). |

### Responses

#### `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "deviceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `token` | `string` | Signed JWT containing `userId`, `walletAddress`, and `deviceId` claims. |
| `deviceId` | `string` | UUID of the registered device. |

#### `400 Bad Request`

Returned by the `validate` middleware when any required field is missing or fails schema validation.

```json
{
  "error": "identityPublicKey is required"
}
```

#### `401 Unauthorized`

A 401 can be returned for several reasons:

**Invalid or expired nonce**
```json
{
  "error": "Invalid or expired nonce"
}
```

**Signature verification failed**
```json
{
  "error": "Signature verification failed"
}
```

**Invalid signature or wallet address**
```json
{
  "error": "Invalid signature or wallet address"
}
```

**Device has been revoked**
```json
{
  "error": "Device has been revoked"
}
```

All 401 responses are also recorded as audit events with the wallet address as the target.

#### `500 Internal Server Error`

```json
{
  "error": "Failed to create user"
}
```

```json
{
  "error": "Failed to register device"
}
```

#### `429 Too Many Requests`

Returned by `verifyLimiter` when the IP exceeds its rate-limit budget.

```json
{
  "error": "Too many requests"
}
```

---

## Worked Example: Full Auth Flow

### Step 1 — Request a challenge nonce

```bash
curl -X POST https://api.clicked.example/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ"}'
```

**Response (200):**
```json
{
  "message": "Sign in to Clicked\nWallet: GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ\nNonce: 8f7a3b2c1d9e4f5a6b7c8d9e0f1a2b3c",
  "nonce": "8f7a3b2c1d9e4f5a6b7c8d9e0f1a2b3c"
}
```

### Step 2 — Sign the message with the Stellar keypair

The client signs the `message` string using their Stellar private key (e.g. via Freighter or `@stellar/stellar-sdk`):

```javascript
import { Keypair } from '@stellar/stellar-sdk';

const keypair = Keypair.fromSecret('S…secret…');
const message = "Sign in to Clicked\nWallet: GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ\nNonce: 8f7a3b2c1d9e4f5a6b7c8d9e0f1a2b3c";
const signature = keypair.sign(Buffer.from(message)).toString('hex');
```

### Step 3 — Verify the signature

```bash
curl -X POST https://api.clicked.example/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ",
    "signature": "3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f",
    "nonce": "8f7a3b2c1d9e4f5a6b7c8d9e0f1a2b3c",
    "identityPublicKey": "MCowBQYDK2VwAyEAu9E2p...",
    "device": {
      "deviceName": "Chrome 120 on macOS",
      "platform": "web",
      "identityPublicKey": "MCowBQYDK2VwAyEAu9E2p...",
      "registrationId": 42,
      "capabilities": ["sealed_box"]
    }
  }'
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMWEyYjNjNC1kNWU2LTQwODgtYmJjYy1kZGVlZmYwMDExMjIiLCJ3YWxsZXRBZGRyZXNzIjoiR0E3UVlORjdTT1dRM0dMUjJCR01aRUhYQVZJUlpBNEtWV0xUSkpGQzdNR1hVQTc0UDdVSVZTR1oiLCJkZXZpY2VJZCI6ImIxYjJjM2Q0LWU1ZjYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTcxOTk5OTk5OX0.signature",
  "deviceId": "b1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

Subsequent requests use the JWT via the `Authorization: Bearer <token>` header.

---

## Refresh / Logout

There are currently **no refresh-token or logout routes** in `routes/auth.ts`. Token expiry is handled by the JWT lifetime configured in `lib/jwt.js`. Clients should discard the token client-side on logout.

---

## Source Reference

| File | Description |
|------|-------------|
| `src/routes/auth.ts` | Route handlers and rate-limiters. |
| `src/schemas/auth.schemas.ts` | Zod validation schemas for request bodies. |
| `src/middleware/rateLimit.ts` | Redis-backed rate limiter (`rateLimit`, `ipIdentifier`). |
| `src/middleware/validate.ts` | Request validation middleware. |
| `src/lib/nonce.ts` | Nonce creation and consumption (`createNonce`, `consumeNonce`). |
| `src/lib/jwt.ts` | JWT signing (`signToken`). |
| `src/services/auditLog.ts` | Audit event recording (`recordAuditEvent`, `requestContext`). |
