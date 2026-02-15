# 025 Service User Endpoint - Implementation Plan

## Implementation Strategy

This feature will be implemented in phases to ensure security, testability, and maintainability.

### Phase 1: Authentication & Authorization Foundation
1. Extend `lib/auth/permissions.ts` with `api-client` role
2. Create Clerk service user in dashboard
3. Write unit tests for permission checks

### Phase 2: Service Endpoints
1. Create `/api/service/courses/route.ts` (GET)
2. Create `/api/service/courses/[id]/route.ts` (GET)
3. Create `/api/service/participations/[id]/route.ts` (GET)
4. Create `/api/service/participations/[id]/result/route.ts` (PUT)

### Phase 3: Security & Monitoring
1. Implement distributed rate limiting middleware (Upstash/Vercel KV/Redis)
2. Add audit logging for service calls (Prisma `ApiLog` model + `lib/logging/audit.ts`)
3. Update Rollbar error tracking and monitoring alerts

### Phase 4: Testing & Documentation
1. Write contract tests for all endpoints
2. Update OpenAPI spec
3. Create quickstart guide

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `app/api/service/courses/route.ts` | List courses endpoint |
| `app/api/service/courses/[id]/route.ts` | Course details endpoint |
| `app/api/service/participations/[id]/route.ts` | Participation details endpoint |
| `app/api/service/participations/[id]/result/route.ts` | Update participation result |
| `lib/middleware/rate-limit.ts` | Rate limiting middleware (distributed store-backed) |
| `tests/contracts/service-api.spec.ts` | Contract tests for service endpoints |
| `lib/validation/service-api-schemas.ts` | Zod schemas for request/response validation of service APIs |
| `types/service-api.ts` | Shared TypeScript types for service API contracts |
| `middleware.ts` | Next.js middleware configuration for CORS / service API policies |

### Modified Files

| File | Changes |
|------|---------|
| `lib/auth/permissions.ts` | Add `api-client` to `UserRole` type, add permission checks |
| `lib/monitoring/rollbar-official.ts` | Add service API logging helpers |
| `docs/api/openapi.yaml` | Add service endpoint definitions |

---

## Database Changes

**No database migrations required.** This feature uses existing models:
- `Course`
- `Booking`
- `CourseParticipation`

---

## API Design

### Endpoint: GET /api/service/courses

**Purpose:** List all courses with participant counts

**Query Parameters:**
- `level` (optional): Filter by course level (BEGINNER, INTERMEDIATE, ADVANCED)
- `published` (optional): Filter by published status (default: true)
- `limit` (optional): Max results (default: 100, max: 500)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```typescript
{
  success: boolean;
  data: Array<{
    id: string;
    title: string;
    slug: string;
    level: CourseLevel;
    startDate: string | null;
    endDate: string | null;
    participantCount: number;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

### Endpoint: GET /api/service/courses/[id]

**Purpose:** Get detailed course information with participations

**Response:**
```typescript
{
  success: boolean;
  data: {
    id: string;
    title: string;
    slug: string;
    level: CourseLevel;
    startDate: string | null;
    endDate: string | null;
    participations: Array<{
      id: string;
      userId: string;
      status: ParticipationStatus;
      createdAt: string;
    }>;
  };
}
```

### Endpoint: GET /api/service/participations/[id]

**Purpose:** Get participation details

**Response:**
```typescript
{
  success: boolean;
  data: {
    id: string;
    userId: string;
    courseId: string;
    status: ParticipationStatus;
    preparationIntent: string | null;
    desiredResults: string | null;
    resultOutcome: string | null;
    resultNotes: string | null;
    resultCompletedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
}
```

### Endpoint: PUT /api/service/participations/[id]/result

**Purpose:** Update participation result data

**Request Body:**
```typescript
{
  resultOutcome?: string; // max 2000 chars
  resultNotes?: string;   // max 2000 chars
  complete?: boolean;     // if true, marks participation as COMPLETE
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## Rate Limiting Strategy

### Implementation Options

**Option A: Distributed Rate Limiter (Recommended for Production / Serverless)**
- Use a distributed store for counters (Vercel KV, Upstash Redis, or self-hosted Redis) instead of an in-memory Map. This ensures correctness across serverless instances and restarts.
- Use atomic increment/check operations (Redis INCR + EXPIRE or Upstash/RateLimit libraries that support sliding windows) to maintain counters and TTLs.
- Integration options: `@upstash/ratelimit` with Upstash Redis, `vercel/kv` for Vercel KV, or a Redis client with Lua script for atomic token-bucket semantics.

**Option B: In-Memory Rate Limiter (Local / Development Only)**
- Use `Map<userId, { count: number, resetAt: Date }>` for local development/testing only. Not suitable for serverless/production.

**Decision:** Use a distributed rate limiter (Option A). Provide an in-memory fallback for local dev/testing.

### Rate Limit Configuration

```typescript
const RATE_LIMITS = {
  'api-client': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  'admin': {
    windowMs: 60 * 1000,
    maxRequests: 500, // Higher limit for admins
  },
};
```

---

## Error Handling

### Standard Error Responses

| Status | Error Code | Description |
|--------|------------|-------------|
| 401 | `UNAUTHORIZED` | No valid JWT token provided |
| 403 | `FORBIDDEN` | User role not authorized for this endpoint |
| 404 | `NOT_FOUND` | Resource (course/participation) not found |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error (logged to Rollbar) |

### Error Response Format

```typescript
{
  success: false;
  error: string;
  code: string;
  details?: unknown;
}
```

---

## Testing Strategy

### Unit Tests
- Permission checks in `lib/auth/permissions.ts`
- Rate limiting logic
- Input validation (Zod schemas)

### Contract Tests
- All service endpoints with valid `api-client` token
- Unauthorized access attempts (wrong role)
- Rate limit enforcement
- Error scenarios (404, 500)

### Integration Tests
- End-to-end flow: Aither → Hemera service API
- JWT token generation and validation
- Data consistency after PUT operations

---

## Deployment Checklist

- [ ] Create Clerk service user in production dashboard
- [ ] Set `publicMetadata.role = "api-client"` for service user
- [ ] Deploy code to Vercel
- [ ] Verify service endpoints are accessible
- [ ] Test rate limiting in production
- [ ] Monitor Rollbar for errors
- [ ] Update API documentation
- [ ] Share service user credentials with Aither team (securely)

Security additions:
- [ ] Define an API key / service credential rotation strategy (e.g., rotate service credentials every 90 days); document the rotation process and CI/deployment steps to roll keys.
- [ ] Use secure credential sharing tools (1Password, HashiCorp Vault, or platform secrets) and forbid plaintext sharing of credentials in chat/email.
- [ ] Consider IP whitelisting for MVP (documented as an optional hardening step); reference future enhancement notes for production IP restrictions and Edge Middleware.
- [ ] Configure Rollbar alerts for unusual API usage patterns and rate-limit breach notifications.

---

## Rollback Plan

If issues arise after deployment:
1. Disable service endpoints by adding feature flag check
2. Revert to previous deployment via Vercel dashboard
3. Investigate errors in Rollbar
4. Fix issues in development branch
5. Re-deploy after testing

---

## Future Enhancements

- **IP Whitelisting:** Restrict service endpoints to known Aither IPs
- **Webhook Support:** Push notifications from Hemera to Aither
- **Bulk Operations:** Batch read/write endpoints for efficiency
- **GraphQL API:** Alternative to REST for flexible queries
- **Service User Dashboard:** Admin UI to monitor service API usage
