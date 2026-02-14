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
| `read:bookings` | ❌ |
| `manage:courses` | ❌ |
| `manage:users` | ❌ |

**Implementation:**
- Create Clerk service users:
  - `aither-service@hemera-academy.com` with `publicMetadata`: `{ "role": "api-client", "service": "aither" }`
  - `gaia-service@hemera-academy.com` with `publicMetadata`: `{ "role": "api-client", "service": "gaia" }`
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

const role = await getUserRole();
if (role !== 'api-client' && role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### 4. Rate Limiting

Implement rate limiting for `/api/service/*` endpoints:
- **Limit:** 100 requests per minute per service user
- **Response on limit exceeded:** `429 Too Many Requests`
- **Header:** `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### 5. Audit Logging

All service API calls must be logged with:
- Service user ID (`aither-service`)
- Endpoint accessed
- Request timestamp
- Response status
- IP address (if available)

Use existing Rollbar integration for error logging.

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

## Non-Functional Requirements

- **Performance:** Service endpoints should respond within 500ms (p95)
- **Availability:** 99.9% uptime (same as main Hemera API)
- **Scalability:** Support up to 1000 requests/hour from Aither
- **Monitoring:** Track service endpoint usage via existing monitoring dashboard
