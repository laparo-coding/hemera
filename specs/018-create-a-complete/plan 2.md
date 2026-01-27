# Implementation Plan: OpenAPI 3.1 & Postman Collection

**Branch**: `018-create-a-complete` | **Date**: 2025-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-create-a-complete/spec.md`

---

## Summary

Create a consolidated OpenAPI 3.1.0 specification documenting all 38 Hemera API endpoints and
generate a corresponding Postman Collection for API testing and exploration. The deliverables
include the OpenAPI YAML file, Postman collection JSON, environment template, and import guide.

---

## Technical Context

**Language/Version**: TypeScript 5.x, YAML (OpenAPI 3.1.0), JSON (Postman Collection v2.1)
**Primary Dependencies**: OpenAPI 3.1.0 specification format, Postman Collection v2.1 format,
Spectral CLI for linting
**Storage**: N/A (documentation files only)
**Testing**: Spectral CLI for OpenAPI validation, manual Postman import verification
**Target Platform**: Developer tooling (Postman, OpenAPI viewers, API documentation)
**Project Type**: Web (Next.js full-stack application)
**Performance Goals**: N/A (static documentation)
**Constraints**: Must accurately reflect all existing API routes, must pass Spectral linting
**Scale/Scope**: 38 API endpoints across 15 route groups

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                    | Status | Notes                                            |
| ---------------------------- | ------ | ------------------------------------------------ |
| No new runtime dependencies  | ✅     | Only dev tooling (Spectral), no production deps  |
| Single source of truth       | ✅     | OpenAPI spec consolidates all API documentation  |
| Existing patterns preserved  | ✅     | Follows existing `/specs/` folder structure      |
| Minimal complexity           | ✅     | Static YAML/JSON files, no code changes          |
| German UI labels documented  | ✅     | Error messages include German glosses            |

---

## Project Structure

### Documentation (this feature)

```
specs/018-create-a-complete/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Schema definitions
├── quickstart.md        # Phase 1: Validation guide
└── contracts/           # Phase 1: OpenAPI spec files
```

### Deliverables (repository root)

```
specs/postman/
├── hemera-api.yaml           # Consolidated OpenAPI 3.1.0 specification
├── hemera-collection.json    # Postman Collection v2.1
├── hemera-environment.json   # Postman Environment template
└── README.md                 # Import and usage guide
```

**Structure Decision**: Deliverables go to `specs/postman/` as a dedicated API documentation folder,
separate from feature specs but following the existing `/specs/` pattern.

---

## Phase 0: Outline & Research

### Research Tasks

1. **Existing OpenAPI fragments**: Scan `specs/*/contracts/` for reusable schema definitions
2. **API route inventory**: Document all 38 routes with HTTP methods, auth requirements, params
3. **Response format patterns**: Extract standard success/error response structures
4. **Spectral configuration**: Review `.spectral.yaml` for linting rules
5. **Clerk JWT documentation**: Research Bearer token format for security schemes

### Unknowns to Resolve

| Topic                     | Research Question                                    |
| ------------------------- | ---------------------------------------------------- |
| Existing schemas          | Which schemas from existing specs can be reused?     |
| Route authentication      | Which routes require auth, admin, or are public?     |
| Request/response examples | What example payloads should be included?            |
| Postman conversion        | Best tool for OpenAPI → Postman conversion?          |

**Output**: research.md with all findings consolidated

---

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

### 1. Data Model (data-model.md)

Extract and document all API schemas:

- **Request Schemas**: Course filters, booking creation, payment intents, etc.
- **Response Schemas**: Standard success wrapper, error format, entity responses
- **Common Components**: Pagination, timestamps, currency formatting

### 2. OpenAPI Specification (contracts/)

Generate `hemera-api.yaml` with:

```yaml
openapi: 3.1.0
info:
  title: Hemera Academy API
  version: 1.0.0

servers:
  - url: http://localhost:3000
    description: Local development
  - url: https://hemera.academy
    description: Production

tags:
  - name: Public
  - name: Auth
  - name: Courses
  - name: Locations
  - name: Bookings
  - name: Checkout
  - name: Payment
  - name: My Courses
  - name: Admin
  - name: Upload
  - name: Webhooks
  - name: Monitoring

paths:
  # 38 endpoints organized by tag

components:
  securitySchemes:
    clerkAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    # Reusable request/response schemas
```

### 3. API Endpoint Inventory

| Group        | Endpoints                                                                            |
| ------------ | ------------------------------------------------------------------------------------ |
| Health       | GET /api/health, GET /api/health/deployment                                          |
| Auth         | GET /api/auth/providers                                                              |
| Courses      | GET /api/courses, GET /api/courses/{id}, GET /api/courses/next                       |
| Locations    | GET /api/locations, GET /api/locations/{id}, GET /api/locations/by-slug/{slug}       |
| Bookings     | GET /api/bookings, POST /api/bookings                                                |
| Checkout     | POST /api/checkout, POST /api/checkout/verify                                        |
| Payment      | POST /api/payment/create-intent, POST /api/payment/confirm                           |
| My Courses   | GET/POST preparation, summary, debriefing, result, resume (5 endpoints)              |
| Users        | GET /api/users, GET /api/users/{id}, GET /api/users/profile                          |
| Admin        | Courses CRUD (6), users, analytics, errors (9 total)                                 |
| Upload       | POST /api/upload/thumbnail, POST /api/upload/location-image                          |
| Webhooks     | POST /api/webhooks/stripe, POST /api/stripe/webhook                                  |
| Monitoring   | POST /api/monitoring/vitals                                                          |
| Demo         | GET /api/demo/errors                                                                 |

### 4. Postman Artifacts

- **hemera-collection.json**: Generated from OpenAPI via converter tool
- **hemera-environment.json**: Variables for baseUrl, clerkToken, adminToken
- **README.md**: Import guide with token acquisition instructions

### 5. Quickstart (quickstart.md)

Validation steps:

1. Run Spectral lint: `npx @stoplight/spectral-cli lint specs/postman/hemera-api.yaml`
2. Import collection into Postman
3. Configure environment variables
4. Execute health check endpoint
5. Verify authenticated endpoint with token

### 6. Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh copilot` to add OpenAPI/Postman technologies.

**Output**: data-model.md, contracts/hemera-api.yaml, quickstart.md, updated copilot-instructions.md

---

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

1. Research tasks for existing specs and route analysis
2. Schema definition tasks (one per component group)
3. Endpoint documentation tasks (grouped by tag)
4. Postman artifact generation tasks
5. Validation and linting tasks

**Ordering Strategy**:

- Research → Schemas → Paths → Postman → Validation
- Mark [P] for parallel endpoint documentation within same auth level

**Estimated Output**: 15-20 numbered tasks in tasks.md

---

## Complexity Tracking

_No constitution violations - straightforward documentation feature_

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |

---

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
