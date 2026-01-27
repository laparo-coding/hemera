# Research: OpenAPI 3.1 & Postman Collection

**Feature**: 019-OpenAPI-Postman  
**Date**: 2025-01-04  
**Status**: Complete

---

## 1. Existing OpenAPI Fragments

### Available Specifications

| Spec Location                                      | Version | Endpoints Covered           | Reusable Schemas            |
| -------------------------------------------------- | ------- | --------------------------- | --------------------------- |
| `specs/001-vercel-postgres-prisma-setup/contracts` | 3.x     | Database setup              | Limited                     |
| `specs/007-public-academy/contracts/openapi.yaml`  | 3.1.0   | Courses (public)            | CourseSummary, Pagination   |
| `specs/015-course-locations/contracts`             | 3.0.3   | Locations CRUD              | Location, LocationInput     |

### Decision

Consolidate reusable schemas from existing specs:
- **CourseSummary**, **CourseDetail**, **Pagination** from 007-public-academy
- **Location**, **LocationInput** from 015-course-locations
- Upgrade all to OpenAPI 3.1.0 format

**Rationale**: Avoid duplication, maintain consistency with existing definitions.

---

## 2. Complete API Route Inventory

### Route Analysis Summary

Total: **56 HTTP handlers** across **38 route files** in **15 groups**

### Public Endpoints (No Auth Required)

| Method | Path                           | Handler Location                          |
| ------ | ------------------------------ | ----------------------------------------- |
| GET    | /api/health                    | app/api/health/route.ts                   |
| GET    | /api/health/deployment         | app/api/health/deployment/route.ts        |
| POST   | /api/health/deployment         | app/api/health/deployment/route.ts        |
| GET    | /api/auth/providers            | app/api/auth/providers/route.ts           |
| GET    | /api/courses                   | app/api/courses/route.ts                  |
| GET    | /api/courses/{id}              | app/api/courses/[id]/route.ts             |
| GET    | /api/courses/next              | app/api/courses/next/route.ts             |
| GET    | /api/locations                 | app/api/locations/route.ts                |
| GET    | /api/locations/{id}            | app/api/locations/[id]/route.ts           |
| GET    | /api/locations/by-slug/{slug}  | app/api/locations/by-slug/[slug]/route.ts |

### Authenticated User Endpoints (Clerk JWT Required)

| Method | Path                                      | Handler Location                                     |
| ------ | ----------------------------------------- | ---------------------------------------------------- |
| GET    | /api/bookings                             | app/api/bookings/route.ts                            |
| POST   | /api/bookings                             | app/api/bookings/route.ts                            |
| POST   | /api/checkout                             | app/api/checkout/route.ts                            |
| GET    | /api/checkout/verify                      | app/api/checkout/verify/route.ts                     |
| POST   | /api/payment/create-intent                | app/api/payment/create-intent/route.ts               |
| POST   | /api/payment/confirm                      | app/api/payment/confirm/route.ts                     |
| GET    | /api/my-courses/{bookingId}/preparation   | app/api/my-courses/[bookingId]/preparation/route.ts  |
| PUT    | /api/my-courses/{bookingId}/preparation   | app/api/my-courses/[bookingId]/preparation/route.ts  |
| GET    | /api/my-courses/{bookingId}/summary       | app/api/my-courses/[bookingId]/summary/route.ts      |
| PUT    | /api/my-courses/{bookingId}/summary       | app/api/my-courses/[bookingId]/summary/route.ts      |
| GET    | /api/my-courses/{bookingId}/debriefing    | app/api/my-courses/[bookingId]/debriefing/route.ts   |
| PUT    | /api/my-courses/{bookingId}/debriefing    | app/api/my-courses/[bookingId]/debriefing/route.ts   |
| GET    | /api/my-courses/{bookingId}/result        | app/api/my-courses/[bookingId]/result/route.ts       |
| PUT    | /api/my-courses/{bookingId}/result        | app/api/my-courses/[bookingId]/result/route.ts       |
| GET    | /api/my-courses/{bookingId}/resume        | app/api/my-courses/[bookingId]/resume/route.ts       |
| POST   | /api/my-courses/{bookingId}/resume        | app/api/my-courses/[bookingId]/resume/route.ts       |
| DELETE | /api/my-courses/{bookingId}/resume        | app/api/my-courses/[bookingId]/resume/route.ts       |
| GET    | /api/users/profile                        | app/api/users/profile/route.ts                       |
| PUT    | /api/users/profile                        | app/api/users/profile/route.ts                       |

### Admin Endpoints (Admin Role Required)

| Method | Path                                           | Handler Location                                         |
| ------ | ---------------------------------------------- | -------------------------------------------------------- |
| GET    | /api/admin/courses                             | app/api/admin/courses/route.ts                           |
| POST   | /api/admin/courses                             | app/api/admin/courses/route.ts                           |
| POST   | /api/admin/courses/create                      | app/api/admin/courses/create/route.ts                    |
| GET    | /api/admin/courses/{id}                        | app/api/admin/courses/[id]/route.ts                      |
| PATCH  | /api/admin/courses/{id}                        | app/api/admin/courses/[id]/route.ts                      |
| DELETE | /api/admin/courses/{id}                        | app/api/admin/courses/[id]/route.ts                      |
| DELETE | /api/admin/courses/delete                      | app/api/admin/courses/delete/route.ts                    |
| POST   | /api/admin/courses/{id}/transfer-enrollments   | app/api/admin/courses/[id]/transfer-enrollments/route.ts |
| GET    | /api/admin/users                               | app/api/admin/users/route.ts                             |
| GET    | /api/admin/analytics                           | app/api/admin/analytics/route.ts                         |
| GET    | /api/users                                     | app/api/users/route.ts                                   |
| POST   | /api/users                                     | app/api/users/route.ts                                   |
| GET    | /api/users/{id}                                | app/api/users/[id]/route.ts                              |
| PUT    | /api/users/{id}                                | app/api/users/[id]/route.ts                              |
| DELETE | /api/users/{id}                                | app/api/users/[id]/route.ts                              |
| POST   | /api/locations                                 | app/api/locations/route.ts                               |
| PUT    | /api/locations/{id}                            | app/api/locations/[id]/route.ts                          |
| DELETE | /api/locations/{id}                            | app/api/locations/[id]/route.ts                          |
| POST   | /api/locations/geocode                         | app/api/locations/geocode/route.ts                       |
| POST   | /api/upload/thumbnail                          | app/api/upload/thumbnail/route.ts                        |
| POST   | /api/upload/location-image                     | app/api/upload/location-image/route.ts                   |

### Webhook Endpoints (External Services)

| Method | Path                    | Handler Location                      |
| ------ | ----------------------- | ------------------------------------- |
| POST   | /api/webhooks/stripe    | app/api/webhooks/stripe/route.ts      |
| POST   | /api/stripe/webhook     | app/api/stripe/webhook/route.ts       |
| GET    | /api/stripe/webhook     | app/api/stripe/webhook/route.ts       |
| POST   | /api/stripe/checkout    | app/api/stripe/checkout/route.ts      |
| GET    | /api/stripe/checkout    | app/api/stripe/checkout/route.ts      |

### Monitoring & Demo Endpoints

| Method | Path                    | Handler Location                      |
| ------ | ----------------------- | ------------------------------------- |
| POST   | /api/monitoring/vitals  | app/api/monitoring/vitals/route.ts    |
| GET    | /api/demo/errors        | app/api/demo/errors/route.ts          |

---

## 3. Response Format Patterns

### Standard Success Response

```json
{
  "success": true,
  "data": { /* payload */ },
  "requestId": "req_abc123"
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "requestId": "req_abc123"
}
```

### Decision

Document both formats in `components/schemas`:
- `SuccessResponse` - wrapper with success: true
- `ErrorResponse` - wrapper with error details

**Rationale**: Consistent response format enables generic client handling.

---

## 4. Authentication Mechanism

### Clerk JWT Bearer Token

- **Type**: HTTP Bearer Token
- **Header**: `Authorization: Bearer <jwt_token>`
- **Provider**: Clerk (clerk.com)
- **Verification**: Server-side via Clerk SDK

### Security Levels

| Level      | Required Header                | Description                          |
| ---------- | ------------------------------ | ------------------------------------ |
| Public     | None                           | No authentication required           |
| Auth       | `Authorization: Bearer <jwt>`  | Valid Clerk JWT required             |
| Admin      | `Authorization: Bearer <jwt>`  | JWT with admin role claim required   |

### Decision

Define in `components/securitySchemes`:
```yaml
clerkAuth:
  type: http
  scheme: bearer
  bearerFormat: JWT
  description: Clerk JWT token obtained from Clerk authentication
```

**Rationale**: Standard OpenAPI security scheme, clear documentation for consumers.

---

## 5. Spectral Linting Configuration

### Current Rules (`.spectral.yaml`)

```yaml
extends: []
formats: [oas3]
rules:
  openapi-3-1-version:
    description: Ensure the OpenAPI version is 3.1.0
    given: $.openapi
    then:
      function: pattern
      functionOptions:
        match: "^3.1.0$"
    severity: warn
```

### Decision

- Use OpenAPI 3.1.0 as required by existing Spectral config
- Run `npx @stoplight/spectral-cli lint` for validation

**Rationale**: Maintains consistency with project standards.

---

## 6. Postman Conversion Tools

### Tool Options Evaluated

| Tool                    | Pros                                  | Cons                        |
| ----------------------- | ------------------------------------- | --------------------------- |
| openapi-to-postmanv2    | Official Postman converter            | CLI installation required   |
| Postman Import (UI)     | Direct import, no tools needed        | No automation               |
| p2o (npm)               | Lightweight, programmable             | Less maintained             |

### Decision

Use **Postman's built-in import** for initial collection, then manually enhance with:
- Pre-request scripts for auth token injection
- Test scripts for response validation
- Environment variable references

**Rationale**: Most reliable, allows manual customization, no additional dependencies.

---

## 7. Deliverables Structure

### Final Output Location

```
specs/postman/
├── hemera-api.yaml           # OpenAPI 3.1.0 specification
├── hemera-collection.json    # Postman Collection v2.1
├── hemera-environment.json   # Environment variables template
└── README.md                 # Import & usage guide
```

### Decision

Place in `specs/postman/` as dedicated API documentation folder.

**Rationale**: Follows existing `/specs/` pattern, clear separation from feature specs.

---

## Summary of Decisions

| Topic                  | Decision                                              |
| ---------------------- | ----------------------------------------------------- |
| OpenAPI Version        | 3.1.0 (required by Spectral config)                   |
| Schema Reuse           | Consolidate from existing specs (007, 015)            |
| Response Format        | Document SuccessResponse and ErrorResponse wrappers   |
| Authentication         | clerkAuth security scheme with Bearer JWT             |
| Postman Conversion     | Manual import + enhancement                           |
| Output Location        | docs/api/ (updated from specs/postman/)               |
| Total Endpoints        | 56 handlers across 38 route files                     |
| Deprecated Endpoints   | `deprecated: true` flag + Sunset header               |
| Rate Limiting          | Description + 429 response schema                     |
| Webhooks               | Regular POST endpoints under `/api/webhooks/*`        |
| Environment Schemas    | Identical schemas, only server URLs differ            |

---

## Clarifications Applied (from spec.md)

Decisions from clarification session 2026-01-04:

1. **Deprecated Endpoints**: Use `deprecated: true` flag + Sunset-Header documentation
   ```yaml
   /api/admin/courses/create:
     post:
       deprecated: true
       description: "⚠️ Deprecated – Use POST /api/admin/courses. Sunset: 2026-06-01"
   ```

2. **Rate-Limited Endpoints**: Description + 429 response with `Retry-After` header
   ```yaml
   responses:
     '429':
       headers:
         Retry-After:
           schema:
             type: integer
   ```

3. **Webhook Endpoints**: Document as regular POST endpoints (Hemera receives, not sends)

4. **Environment Schemas**: Single schema, multiple servers in `servers` array
   ```yaml
   servers:
     - url: http://localhost:3000/api
     - url: https://staging.hemera.app/api
     - url: https://hemera.app/api
   ```

---

## Open Questions (Resolved)

| Question                                              | Resolution                                    |
| ----------------------------------------------------- | --------------------------------------------- |
| Which schemas from existing specs can be reused?      | CourseSummary, CourseDetail, Location         |
| Which routes require auth, admin, or are public?      | See Section 2 categorization                  |
| What example payloads should be included?             | Common CRUD operations per entity             |
| Best tool for OpenAPI → Postman conversion?           | Postman native import                         |

---

_Research complete. Ready for Phase 1: Design & Contracts._
