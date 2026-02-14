# 025 Service User Endpoint

## Overview

Enable secure API access for the Aither application to read course and participation data, and write participation results to Hemera. This feature introduces a dedicated Clerk service user with restricted permissions and new `/api/service/*` endpoints.

## Context

The **Aither** and **Gaia** applications (both Next.js + Clerk) need to:
1. Read course and participation data from Hemera
2. Write participant-specific results to `CourseParticipation` fields (`resultOutcome`, `resultNotes`)

All three applications (Hemera, Aither, Gaia) use Clerk as their authentication provider.

## User Requirements

### 1. Service User Role

Introduce a new user role `api-client` with restricted permissions:

| Permission | Allowed |
|------------|---------|
| `read:courses` | ✅ |
| `read:participations` | ✅ |
| `write:participation-results` | ✅ |
| `read:bookings` | ✅ (booking metadata and non-sensitive fields only; payment details excluded) |
| `manage:courses` | ❌ |
| `manage:users` | ❌ |

**Implementation:**
- Implement an idempotent setup script `scripts/create-clerk-service-users.ts` that creates/updates the following Clerk service users and sets `publicMetadata` appropriately:
  - `aither-service@hemera-academy.com` → `{ "role": "api-client", "service": "aither" }`
  - `gaia-service@hemera-academy.com` → `{ "role": "api-client", "service": "gaia" }`
- The script should be safe to run in CI/deploy pipelines to ensure users exist and match expected metadata. Alternatively, document manual Clerk dashboard steps for emergencies.
- Extend `lib/auth/permissions.ts` to support `api-client` role

### 2. Service API Endpoints

Create new route group `/api/service/*` with the following endpoints:

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/service/courses` | GET | List all courses with participant counts | `api-client` or `admin` |
| `/api/service/courses/[id]` | GET | Get course details with participations | `api-client` or `admin` |
| `/api/service/participations/[id]` | GET | Get participation details | `api-client` or `admin` |
| `/api/service/participations/[id]/result` | PUT | Update participation result data | `api-client` or `admin` |

**Response Format (GET /api/service/courses):**
```json
{
  "success": true,
  "data": [
    {
      "id": "course_123",
      "title": "Advanced Leadership",
      "slug": "advanced-leadership",
      "level": "ADVANCED",
      "startDate": "2026-03-15T09:00:00Z",
      "endDate": "2026-03-17T17:00:00Z",
      "participantCount": 12
    }
  ]
}
```

**Response Format (GET /api/service/participations/[id]):**
```json
{
  "success": true,
  "data": {
    "id": "participation_456",
    "userId": "user_789",
    "courseId": "course_123",
    "status": "RESULT",
    "resultOutcome": "Successfully completed all objectives",
    "resultNotes": "Excellent performance in group exercises",
    "resultCompletedAt": "2026-03-20T14:30:00Z"
  }
}
```

**Request Format (PUT /api/service/participations/[id]/result):**
```json
{
  "resultOutcome": "Successfully completed all objectives",
  "resultNotes": "Excellent performance in group exercises",
  "complete": true
}
```

Behavior of `complete` field:
- `complete: true`: marks the Participation `status` as the final value (e.g., `COMPLETED`), sets `resultCompletedAt` to the current server timestamp, and persists `resultOutcome` and `resultNotes`.
- `complete: false`: reopens the participation — implementation SHOULD allow clearing `resultCompletedAt` and set `status` to an appropriate non-final value (e.g., `IN_PROGRESS`), and update `resultOutcome`/`resultNotes` as provided. If business rules prevent re-opening, the endpoint should return `400` with a clear error message.

**Response (PUT /api/service/participations/[id]/result):**
```json
{
  "success": true,
  "data": {
    "id": "participation_456",
    "status": "COMPLETED",
    "resultOutcome": "Successfully completed all objectives",
    "resultNotes": "Excellent performance in group exercises",
    "resultCompletedAt": "2026-03-20T14:30:00Z"
  }
}
```

### 3. Authentication & Authorization

Each `/api/service/*` endpoint must:
1. Verify Clerk JWT token via `auth()` from `@clerk/nextjs/server`
2. Check user role via `getUserRole()` from `lib/auth/permissions.ts`
3. Allow access only if role is `api-client` or `admin`
4. Return `403 Forbidden` for unauthorized roles

**Example Guard:**
```typescript
const { userId } = await auth();
if (!userId) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}

// Pass the userId into getUserRole so the implementation can fetch the Clerk user
const role = await getUserRole(userId);
if (role !== 'api-client' && role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### 4. Rate Limiting

Implement rate limiting for `/api/service/*` endpoints:
- **Limit:** 100 requests per minute per service user
- **Response on limit exceeded:** `429 Too Many Requests`
- **Headers:** `X-RateLimit-Remaining`, `X-RateLimit-Reset` (Unix timestamp UTC) and `Retry-After` (seconds until reset)

Implementation details:
- Choose a distributed backing store for production (e.g., Upstash Redis, self-hosted Redis, or Vercel KV) to support serverless/horizontal scaling.
- Recommended libraries: `@upstash/ratelimit` (Upstash), or implement Redis atomic `INCR` + `EXPIRE` or a token-bucket algorithm via Lua for correctness.
- X-RateLimit-Reset: use Unix timestamp (UTC) when the current window expires. Include `X-RateLimit-Remaining` with remaining tokens.
- On 429 responses include `Retry-After` with seconds until reset.
- Provide an in-memory fallback for local development only; do not use in-memory counters in production.

### 5. Audit Logging

All service API calls must be persisted to an audit log for compliance and analysis. Implementation guidance:

- Add a Prisma model `ApiLog` to `prisma/schema.prisma` and migrate. Example model:

```prisma
model ApiLog {
  id             String   @id @default(cuid())
  serviceUserId  String
  endpoint       String
  method         String
  timestamp      DateTime @default(now())
  responseStatus Int
  ipAddress      String?  
  metadata       Json?
  createdAt      DateTime @default(now())
}
```

- Implement a central audit logger `logServiceApiCall()` (e.g., `lib/logging/audit.ts`) that writes a record for every `/api/service/*` request.
- Keep Rollbar for error/exception telemetry only; use DB audit logs for full request trails.
- Retention: configure `AUDIT_LOG_RETENTION_DAYS` (e.g., 90 days) and implement a scheduled purge job to delete older records.

## Acceptance Criteria

### Feature 1: Service User Role
- [ ] `api-client` role added to `UserRole` type in `lib/auth/permissions.ts`
- [ ] Permission checks implemented for `read:courses`, `read:participations`, `write:participation-results`
- [ ] Clerk service user created with `publicMetadata.role = "api-client"`

### Feature 2: Service Endpoints
- [ ] `GET /api/service/courses` returns course list with participant counts
- [ ] `GET /api/service/courses/[id]` returns course details with participations
- [ ] `GET /api/service/participations/[id]` returns participation details
- [ ] `PUT /api/service/participations/[id]/result` updates result fields
- [ ] All endpoints return proper error responses (401, 403, 404, 500)

### Feature 3: Authentication & Authorization
- [ ] All service endpoints verify Clerk JWT token
- [ ] Role check allows only `api-client` and `admin` roles
- [ ] Unauthorized access returns `403 Forbidden`
- [ ] Missing authentication returns `401 Unauthorized`

### Feature 4: Rate Limiting
- [ ] Rate limiting enforced at 100 req/min per service user
- [ ] `429 Too Many Requests` returned when limit exceeded
- [ ] Rate limit headers included in responses

### Testing & Documentation (Acceptance)
- [ ] New service endpoints covered by unit and contract tests with at least 80% coverage for new code paths
- [ ] Integration/E2E tests exercise Clerk auth using a test Clerk service token or dedicated test account to validate auth, role checks and rate-limiting
- [ ] OpenAPI/Swagger documentation created for all `/api/service/*` endpoints with request/response schemas and auth requirements

### Feature 5: Audit Logging
- [ ] All service API calls logged with user ID, endpoint, timestamp
- [ ] Errors logged to Rollbar with context
- [ ] Successful operations logged for audit trail

## Dependencies

- Existing Clerk authentication setup
- Existing `lib/auth/permissions.ts` module
- Existing Prisma models: `Course`, `Booking`, `CourseParticipation`
- Rollbar monitoring integration

## Out of Scope

- IP whitelisting (can be added later if Aither has static IP)
- Webhook-based notifications from Hemera to Aither
- Bulk operations (batch updates)
- GraphQL API (REST only for now)
- Aither-side implementation (separate project)

## Security Considerations

- **Principle of Least Privilege:** `api-client` role has minimal required permissions
- **JWT Validation:** Clerk verifies token integrity and expiration
- **Audit Trail:** All actions attributed to service user for accountability
- **Rate Limiting:** Prevents abuse and ensures fair resource usage
- **No Sensitive Data:** Booking payment details (Stripe) not exposed via service endpoints

Additional controls required:

- CORS rules for `/api/service/*`: allow only known origins or internal services; set `Access-Control-Allow-Methods: GET, PUT, OPTIONS`; `Access-Control-Allow-Credentials: true` only if cookies/sessions are used. Document allowed origins in environment or deployment config.
- Request validation: All `/api/service/*` endpoints must validate inputs using Zod schemas (e.g., `lib/validation/service-api-schemas.ts`) and return `400` for malformed requests.
- Database safety: Use Prisma ORM parameterized queries or query builders to avoid SQL injection; never construct raw SQL with untrusted interpolation.
- Secrets management: Clerk service-user API keys and `CLERK_SECRET_KEY` must be stored in a secrets manager (Vercel Secrets, Vault, 1Password) and not committed to the repo. Rotate keys regularly and follow least-privilege scopes.

## Non-Functional Requirements

- **Performance:** Service endpoints should respond within 500ms (p95)
- **Availability:** 99.9% uptime (same as main Hemera API)
- **Scalability:** Support up to 6000 requests/hour per service user (aligns with 100 req/min rate limit)
- **Monitoring:** Track service endpoint usage via existing monitoring dashboard
