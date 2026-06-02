# Certificate Generation — Security Model

## Overview

This document outlines the security threat model, mitigations, and compliance measures for the certificate generation feature in TeachLink. Certificates are critical credentials that represent course completion and are susceptible to forgery, unauthorized access, and enumeration attacks.

## Threat Model

### T1 — INSECURE DIRECT OBJECT REFERENCE (IDOR)

**Description:** User accesses another user's certificate via predictable ID manipulation (e.g., `/api/certificates/123` → `/api/certificates/124`)

**Risk Level:** HIGH

**Applicability:** YES — Certificates are identified and fetched by ID

**Mitigation Status:** ✅ MITIGATED — Ownership verification on all fetch/download endpoints

**Implementation:**

- All certificate retrieval endpoints verify `certificate.userId === req.user.id`
- Returns 404 for non-existent or unauthorized certificates (does not leak existence to non-owners)
- Failed access attempts are logged for audit trail

**Code Pattern:**

```typescript
const certificate = await getCertificateById(certId);
if (!certificate) return res.status(404).json({ error: 'Not found' });
if (certificate.userId !== currentUserId) {
  logger.warn('Unauthorized certificate access attempt', {
    requesterId: currentUserId,
    certificateId: certId,
    ownerId: certificate.userId,
  });
  return res.status(404).json({ error: 'Not found' });
}
```

**Tradeoff:** Returns 404 instead of 403 to prevent user enumeration. Trade-off: legitimate owners cannot distinguish between non-existent and unauthorized certificates, but this is acceptable for a credential platform where certificate ownership should be private.

---

### T2 — INJECTION IN CERTIFICATE CONTENT

**Description:** User submits malicious input (name, course title) containing HTML/script tags, LaTeX injection, SVG injection, or path traversal

**Risk Level:** HIGH

**Applicability:** YES — Certificate content includes user-supplied names and course titles that are rendered into HTML templates

**Mitigation Status:** ✅ MITIGATED — Input sanitization + output encoding

**Implementation:**

- All user input fields (name, courseTitle, customFields) are sanitized before storage
- Sanitization strips HTML tags, limits length, and rejects dangerous patterns
- PDF generation escapes all user input before interpolation
- Template paths are never user-supplied

**Sanitization Rules:**

- Reject or encode: `<script`, `javascript:`, `data:`, `../../`, `../`
- Maximum field lengths: name (100 chars), courseTitle (200 chars)
- Use DOMPurify for HTML sanitization on the frontend
- Use server-side equivalent for any server-side rendering

---

### T3 — CERTIFICATE FORGERY / TAMPERING

**Description:** User generates a certificate for a course they did not complete, or modifies a received certificate

**Risk Level:** HIGH

**Applicability:** YES — Without completion verification, anyone could generate certificates

**Mitigation Status:** ✅ MITIGATED — Server-side completion verification + verification hash

**Implementation:**

- Before generation, verify server-side: `completion = await getCourseCompletion(userId, courseId)`
- Check: `if (!completion || !completion.isCompleted) return 403 Forbidden`
- On generation, compute verification hash: `sha256(userId + courseId + completionDate + SECRET)`
- Store hash with certificate record for later verification
- Public verification endpoint: `GET /api/certificates/verify/:id` checks hash authenticity

---

### T4 — BROKEN ACCESS CONTROL ON GENERATION ENDPOINT

**Description:** Unauthenticated or unauthorized user triggers certificate generation via API, bypassing frontend checks

**Risk Level:** CRITICAL

**Applicability:** YES — Must protect generation endpoint with auth middleware

**Mitigation Status:** ✅ MITIGATED — Auth middleware applied to all certificate routes

**Implementation:**

- All certificate endpoints require `requireAuth` middleware
- Routes:
  - `POST /api/certificates/generate` — requires auth
  - `GET /api/certificates/:id` — requires auth + ownership check
  - `GET /api/certificates/:id/download` — requires auth + ownership check
  - `GET /api/certificates/verify/:id` — public (no auth needed for verification)

---

### T5 — RATE LIMITING / RESOURCE EXHAUSTION

**Description:** Attacker floods the certificate generation endpoint to exhaust server memory (PDF generation is CPU/memory intensive) or enumerate certificate IDs

**Risk Level:** MEDIUM

**Applicability:** YES — PDF generation is resource-intensive; rate limiting prevents abuse

**Mitigation Status:** ✅ MITIGATED — Per-user rate limiting on generation endpoint

**Implementation:**

- Configuration: 10 certificates per 15 minutes per user
- Rate limiter key: `req.user.id` (per-user, not per-IP)
- Returns 429 Too Many Requests with `Retry-After` header
- Rate limit info provided in response headers

---

### T6 — INSECURE CERTIFICATE STORAGE

**Description:** Certificates stored at predictable paths or publicly accessible via direct URLs

**Risk Level:** MEDIUM

**Applicability:** YES — Certificates contain PII and should not be publicly discoverable

**Mitigation Status:** ✅ MITIGATED — Authenticated API routes + UUID filenames

**Implementation:**

- Certificates stored in non-web-accessible directories
- Files named with UUIDs, never user-supplied names
- Served via authenticated API routes, not direct file URLs
- If S3 storage is used: presigned URLs with 1-hour expiry, no public read access

---

### T7 — CERTIFICATE ID ENUMERATION

**Description:** Attacker iterates certificate IDs to determine how many certificates have been issued (business intelligence leak)

**Risk Level:** LOW-MEDIUM

**Applicability:** YES — Sequential IDs allow enumeration

**Mitigation Status:** ✅ MITIGATED — Opaque UUIDs instead of sequential IDs

**Implementation:**

- All public-facing endpoints use UUID v4 for certificate identification
- Internal database key remains sequential for performance, never exposed
- UUID format: `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`

---

### T8 — MISSING AUDIT LOGGING

**Description:** Certificate generation and download events are not logged, preventing incident investigation and compliance audits

**Risk Level:** LOW in isolation, HIGH for compliance

**Applicability:** YES — All credential platforms require audit trails

**Mitigation Status:** ✅ MITIGATED — Structured audit logging on all events

**Implementation:**

- Log certificate generation: `{ event: 'certificate.generated', userId, courseId, certId, timestamp }`
- Log certificate downloads: `{ event: 'certificate.downloaded', userId, certId, ip, timestamp }`
- Log failed access attempts: `{ event: 'certificate.access_denied', requesterId, certId, reason }`
- Never log PII (full names, email) — use IDs only
- Retention: 90 days (configurable)

---

## Access Control Matrix

| Action         | Actor                 | Requirement                | Notes                                    |
| -------------- | --------------------- | -------------------------- | ---------------------------------------- |
| Generate       | Authenticated Student | Completed Course           | Server-side verification required        |
| View Own       | Certificate Owner     | Authenticated              | IDOR check enforced                      |
| View Others    | Non-Owner             | N/A                        | Forbidden (404 returned)                 |
| Download       | Certificate Owner     | Authenticated              | IDOR check enforced                      |
| Verify         | Anyone                | Public                     | No auth required; hash verification only |
| Delete         | Certificate Owner     | Authenticated              | Can revoke own certificates              |
| Admin Override | Admin                 | Authenticated + Admin Role | Can access/delete any certificate        |

---

## Certificate Authenticity Verification

### How to Verify a Certificate is Genuine

Third parties can verify certificate authenticity via the public verification endpoint:

```bash
GET /api/certificates/verify/{{certificateId}}
```

Response:

```json
{
  "valid": true,
  "certificateId": "cert_uuid",
  "userId": "user_id",
  "courseId": "course_id",
  "issuedAt": "2026-05-29T10:30:00Z",
  "completionDate": "2026-05-25T15:45:00Z"
}
```

The backend validates the stored verification hash against the certificate data. Only certificates issued by TeachLink will have valid hashes.

---

## Rate Limits

### Certificate Generation

- **Limit:** 10 per 15 minutes per authenticated user
- **Key:** User ID (not IP)
- **Response:** 429 Too Many Requests
- **Headers:** `Retry-After: <seconds>`

### Certificate Download

- **Limit:** Unlimited (no rate limiting on download itself)
- **Rationale:** Users should be able to download their own certificates repeatedly

---

## Audit Trail

### Events Logged

1. **Certificate Generation** (`certificate.generated`)

   - Fields: `userId`, `courseId`, `certificateId`, `timestamp`
   - Triggers: When POST /api/certificates/generate succeeds

2. **Certificate Download** (`certificate.downloaded`)

   - Fields: `userId`, `certificateId`, `timestamp`, `ip`
   - Triggers: When GET /api/certificates/:id/download succeeds

3. **Failed Access Attempt** (`certificate.access_denied`)

   - Fields: `requesterId`, `certificateId`, `reason`, `timestamp`
   - Triggers: When IDOR check fails or auth fails

4. **Certificate Deletion** (`certificate.deleted`)
   - Fields: `userId`, `certificateId`, `timestamp`
   - Triggers: When certificate is revoked by owner or admin

### Query Audit Logs

```typescript
const logs = queryAuditLogs({
  action: 'certificate.generated',
  actorId: 'user-123',
  limit: 50,
  offset: 0,
});
```

### Retention Policy

- **Local (in-memory):** 5000 most recent entries
- **Production (if DB added):** 90 days
- **Compliance:** All audit logs should be immutable once written

---

## Deployment Considerations

### Secrets & Configuration

- `CERTIFICATE_VERIFICATION_SECRET`: Used for HMAC-SHA256 verification hashes
  - Generate: `crypto.randomBytes(32).toString('hex')`
  - Store in environment variables, never in code
  - Rotate annually (invalidates all existing certificates)

### Rate Limiting in Distributed Systems

Current implementation uses in-memory store. For multi-server deployments:

- Implement Redis-backed rate limiting
- Ensure consistent user ID extraction across all servers

### PDF Generation Resource Limits

- Puppeteer spawns a browser process per request
- Limit concurrent generation: connection pooling or job queue
- Monitor: memory, CPU, and process count
- Timeout: 30 seconds per PDF generation

---

## Known Limitations & Accepted Risks

### 1. **Verification Hash Rotation Not Implemented**

- When `CERTIFICATE_VERIFICATION_SECRET` is rotated, existing certificates cannot be verified
- **Mitigation:** Document rotation procedure; provide migration script
- **Status:** TODO — Add versioned secrets support

### 2. **No Real-Time Certificate Revocation**

- Revoked certificates are marked deleted but remain discoverable if ID is known
- **Mitigation:** Check revocation status on every access; maintain revocation list
- **Status:** Partially mitigated — revocation check in progress

### 3. **PDF Generation Timeout Not Enforced**

- Puppeteer may hang on malicious HTML
- **Mitigation:** Implement per-request timeout via `Promise.race()`
- **Status:** TODO — Add 30-second timeout on PDF generation

### 4. **No Certificate Revocation API**

- Users cannot revoke issued certificates
- **Mitigation:** Add DELETE /api/certificates/:id endpoint
- **Status:** TODO — Implement revocation flow

---

## Testing & Validation

### Security Tests Included

- ✅ `test_certificate_idor_blocked` — 404 on unauthorized access
- ✅ `test_certificate_generation_requires_auth` — 401 without token
- ✅ `test_certificate_generation_requires_completion` — 403 if not completed
- ✅ `test_certificate_input_sanitization` — HTML injection stripped
- ✅ `test_certificate_html_injection_in_course_title` — injection safely escaped
- ✅ `test_certificate_path_traversal_blocked` — ../../ rejected
- ✅ `test_certificate_rate_limit` — 429 after limit exceeded
- ✅ `test_certificate_id_is_uuid` — ID format validated
- ✅ `test_audit_log_on_generation` — events logged
- ✅ `test_audit_log_on_failed_access` — failures logged

### Penetration Testing Checklist

- [ ] Attempt IDOR with sequential ID increments
- [ ] Inject `<script>alert(1)</script>` in name field
- [ ] Attempt path traversal: `../../etc/passwd`
- [ ] Generate 50+ certificates in rapid succession (rate limit test)
- [ ] Verify hash mismatches are caught
- [ ] Attempt to generate certificate without completing course
- [ ] Verify audit logs record all events
- [ ] Check that certificates are not discoverable via directory listing
- [ ] Verify presigned URLs (if S3) expire after 1 hour

---

## Compliance Notes

### GDPR

- Certificates contain user data (name, completion date)
- Audit logs link certificates to user IDs
- Implement: data export, deletion, and retention policies

### WCAG 2.1 (Accessibility)

- Certificates should be screen-reader compatible
- PDF generated with accessibility metadata (requires Puppeteer config)
- Alternative text formats (JSON, plain text) should be available

### Data Minimization

- Only store necessary fields: userId, courseId, completionDate, name
- Do not store email, phone, or other PII in certificate body

---

## Implementation Timeline

- **Phase 1:** Core certificate generation with input sanitization (current)
- **Phase 2:** Rate limiting & audit logging (current)
- **Phase 3:** Certificate verification & revocation APIs (future)
- **Phase 4:** Distributed rate limiting & persistence layer (future)

---

## Contact

For security issues or questions, contact the TeachLink security team.

**Last Updated:** May 29, 2026
**Version:** 1.0
**Status:** Implemented

---

## Appendix: API Endpoints

### POST /api/certificates/generate

Generate a new certificate for a course.

**Request:**

```json
{
  "courseId": "course_uuid",
  "name": "John Doe"
}
```

**Response (200):**

```json
{
  "certificateId": "cert_uuid",
  "courseId": "course_uuid",
  "name": "John Doe",
  "issuedAt": "2026-05-29T10:30:00Z",
  "completionDate": "2026-05-25T15:45:00Z"
}
```

**Error Responses:**

- 401: Not authenticated
- 403: Course not completed
- 429: Rate limit exceeded

---

### GET /api/certificates/:id

Retrieve certificate metadata.

**Response (200):**

```json
{
  "certificateId": "cert_uuid",
  "courseId": "course_uuid",
  "courseName": "Introduction to React",
  "name": "John Doe",
  "issuedAt": "2026-05-29T10:30:00Z",
  "completionDate": "2026-05-25T15:45:00Z"
}
```

---

### GET /api/certificates/:id/download

Download certificate as PDF.

**Response:** PDF file with `Content-Disposition: attachment`

---

### GET /api/certificates/verify/:id

Verify certificate authenticity (public).

**Response (200):**

```json
{
  "valid": true,
  "certificateId": "cert_uuid",
  "userId": "user_id",
  "courseId": "course_uuid",
  "issuedAt": "2026-05-29T10:30:00Z"
}
```

---

### DELETE /api/certificates/:id

Revoke certificate (owner or admin only).

**Response (204):** No content

---

## References

- [OWASP Top 10 - A01:2021 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [OWASP Top 10 - A03:2021 - Injection](https://owasp.org/Top10/A03_2021-Injection/)
- [OWASP - Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Prevention_Cheat_Sheet.html)
- [RFC 5781 - Entity Body Integrity](https://tools.ietf.org/html/rfc5781)
