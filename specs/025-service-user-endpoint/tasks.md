# 025 Service User Endpoint - Implementation Tasks

## Phase 1: Authentication & Authorization Foundation

### Task 1.1: Extend Permission System
- [ ] Add `'api-client'` to `UserRole` type in `lib/auth/permissions.ts`
- [ ] Update `VALID_ROLES` array to include `'api-client'`
- [ ] Add permission definitions for `api-client` role:
  - `read:courses` ✅
  - `read:participations` ✅
  - `write:participation-results` ✅
- [ ] Update `hasPermission()` function to handle new permissions
- [ ] Write unit tests for `api-client` permission checks

**Files:**
- `lib/auth/permissions.ts`
- `tests/unit/auth/permissions.spec.ts` (new)

**Acceptance:**
- `getUserRole()` returns `'api-client'` for service user
- `hasPermission('read:courses')` returns `true` for `api-client`
- `hasPermission('manage:courses')` returns `false` for `api-client`

---

### Task 1.2: Create Clerk Service Users
- [ ] Log into Clerk Dashboard (production)
- [ ] Create new user: `aither-service@hemera-academy.com`
  - Set `publicMetadata`: `{ "role": "api-client", "service": "aither" }`
- [ ] Create new user: `gaia-service@hemera-academy.com`
  - Set `publicMetadata`: `{ "role": "api-client", "service": "gaia" }`
- [ ] Generate and securely store service user credentials for both
- [ ] Document service user IDs in `.env.example` (as comments)

**Manual Steps:**
1. Navigate to Clerk Dashboard → Users
2. Click "Create User"
3. For Aither:
   - Email: `aither-service@hemera-academy.com`
   - Public Metadata: `{ "role": "api-client", "service": "aither" }`
4. For Gaia:
   - Email: `gaia-service@hemera-academy.com`
   - Public Metadata: `{ "role": "api-client", "service": "gaia" }`
5. Save user IDs for testing

**Acceptance:**
- Both service users exist in Clerk
- `publicMetadata.role` is `"api-client"` for both
- Both service users can authenticate via Clerk SDK

---

## Phase 2: Service Endpoints

### Task 2.1: Create GET /api/service/courses
- [ ] Create `app/api/service/courses/route.ts`
- [ ] Implement auth guard (check `api-client` or `admin` role)
- [ ] Query courses from Prisma with participant counts
- [ ] Support query parameters: `level`, `published`, `limit`, `offset`
- [ ] Return paginated response with course list
- [ ] Handle errors (401, 403, 500)
- [ ] Add Rollbar logging for errors

**Files:**
- `app/api/service/courses/route.ts` (new)

**Acceptance:**
- Endpoint returns 200 with course list for `api-client`
- Endpoint returns 403 for `user` role
- Endpoint returns 401 for unauthenticated requests
- Pagination works correctly

---

### Task 2.2: Create GET /api/service/courses/[id]
- [ ] Create `app/api/service/courses/[id]/route.ts`
- [ ] Implement auth guard
- [ ] Query course by ID with participations
- [ ] Return course details with participation list
- [ ] Handle 404 if course not found
- [ ] Add Rollbar logging

**Files:**
- `app/api/service/courses/[id]/route.ts` (new)

**Acceptance:**
- Endpoint returns 200 with course details for valid ID
- Endpoint returns 404 for invalid ID
- Participations array is included in response

---

### Task 2.3: Create GET /api/service/participations/[id]
- [ ] Create `app/api/service/participations/[id]/route.ts`
- [ ] Implement auth guard
- [ ] Query participation by ID from Prisma
- [ ] Return participation details (all fields)
- [ ] Handle 404 if participation not found
- [ ] Add Rollbar logging

**Files:**
- `app/api/service/participations/[id]/route.ts` (new)

**Acceptance:**
- Endpoint returns 200 with participation details
- Endpoint returns 404 for invalid ID
- All participation fields are included

---

### Task 2.4: Create PUT /api/service/participations/[id]/result
- [ ] Create `app/api/service/participations/[id]/result/route.ts`
- [ ] Implement auth guard
- [ ] Validate request body with Zod schema
- [ ] Update `resultOutcome` and `resultNotes` fields
- [ ] If `complete: true`, update status to `COMPLETE` and set `resultCompletedAt`
- [ ] Return success response
- [ ] Handle validation errors (400)
- [ ] Add Rollbar logging

**Files:**
- `app/api/service/participations/[id]/result/route.ts` (new)

**Acceptance:**
- Endpoint updates participation result fields
- Endpoint marks participation as COMPLETE when `complete: true`
- Endpoint returns 400 for invalid input
- Database is updated correctly

---

## Phase 3: Security & Monitoring

### Task 3.1: Implement Rate Limiting
- [ ] Create `lib/middleware/rate-limit.ts`
- [ ] Implement in-memory rate limiter with `Map<userId, RateLimitState>`
- [ ] Configure limits: 100 req/min for `api-client`, 500 req/min for `admin`
- [ ] Add rate limit headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [ ] Return 429 when limit exceeded
- [ ] Apply middleware to all `/api/service/*` routes

**Files:**
- `lib/middleware/rate-limit.ts` (new)
- `app/api/service/*/route.ts` (modify to use middleware)

**Acceptance:**
- Rate limiting enforces 100 req/min for `api-client`
- 429 response returned when limit exceeded
- Rate limit headers present in responses

---

### Task 3.2: Add Audit Logging
- [ ] Create `lib/monitoring/service-api-logger.ts`
- [ ] Log all service API calls with:
  - User ID
  - Endpoint
  - Timestamp
  - Response status
  - IP address (if available)
- [ ] Integrate with Rollbar for error tracking
- [ ] Add success logging for audit trail

**Files:**
- `lib/monitoring/service-api-logger.ts` (new)
- `app/api/service/*/route.ts` (modify to add logging)

**Acceptance:**
- All service API calls are logged
- Errors are tracked in Rollbar
- Logs include user ID and endpoint

---

## Phase 4: Testing & Documentation

### Task 4.1: Write Contract Tests
- [ ] Create `tests/contracts/service-api.spec.ts`
- [ ] Test GET /api/service/courses (success, pagination, filters)
- [ ] Test GET /api/service/courses/[id] (success, 404)
- [ ] Test GET /api/service/participations/[id] (success, 404)
- [ ] Test PUT /api/service/participations/[id]/result (success, validation errors)
- [ ] Test auth guards (401, 403)
- [ ] Test rate limiting (429)

**Files:**
- `tests/contracts/service-api.spec.ts` (new)

**Acceptance:**
- All endpoints have contract tests
- Tests cover success and error scenarios
- Tests verify auth and rate limiting

---

### Task 4.2: Update OpenAPI Spec
- [ ] Add `/api/service/courses` endpoint to `docs/api/openapi.yaml`
- [ ] Add `/api/service/courses/{id}` endpoint
- [ ] Add `/api/service/participations/{id}` endpoint
- [ ] Add `/api/service/participations/{id}/result` endpoint
- [ ] Document request/response schemas
- [ ] Document auth requirements

**Files:**
- `docs/api/openapi.yaml`

**Acceptance:**
- OpenAPI spec includes all service endpoints
- Schemas are accurate and complete
- Auth requirements are documented

---

### Task 4.3: Create Quickstart Guide
- [ ] Create `specs/025-service-user-endpoint/quickstart.md`
- [ ] Document how to test service endpoints locally
- [ ] Provide example curl commands
- [ ] Document how to generate service user JWT
- [ ] Add troubleshooting section

**Files:**
- `specs/025-service-user-endpoint/quickstart.md` (new)

**Acceptance:**
- Quickstart guide is clear and complete
- Examples work correctly
- Troubleshooting covers common issues

---

## Deployment Tasks

### Task 5.1: Production Deployment
- [ ] Create both Clerk service users in production dashboard (Aither + Gaia)
- [ ] Deploy code to Vercel
- [ ] Verify service endpoints are accessible
- [ ] Test with both service user credentials
- [ ] Monitor Rollbar for errors
- [ ] Update production documentation

**Acceptance:**
- Service endpoints work in production
- No errors in Rollbar
- Both service users can authenticate successfully

---

### Task 5.2: Share Credentials with Client Teams
- [ ] Securely share Aither service user credentials (use 1Password or similar)
- [ ] Securely share Gaia service user credentials
- [ ] Provide API documentation link to both teams
- [ ] Schedule sync meetings to answer questions
- [ ] Document integration in both Aither and Gaia projects

**Acceptance:**
- Aither team has their service user credentials
- Gaia team has their service user credentials
- Both teams can access service endpoints
- Integration is documented in both projects

---

## Summary

**Total Tasks:** 15
**Estimated Effort:** 3-4 days

**Critical Path:**
1. Task 1.1 → Task 1.2 (Auth foundation)
2. Task 2.1 → Task 2.2 → Task 2.3 → Task 2.4 (Endpoints)
3. Task 3.1 → Task 3.2 (Security)
4. Task 4.1 → Task 4.2 → Task 4.3 (Testing & Docs)
5. Task 5.1 → Task 5.2 (Deployment)
