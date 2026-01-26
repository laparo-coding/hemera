# Implementation Plan: OpenAPI 3.1 & Postman Collection

**Branch**: `019-OpenAPI-Postman` | **Date**: 2026-01-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/019-OpenAPI-Postman/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path ✅
   → Feature spec loaded successfully
2. Fill Technical Context ✅
   → Project Type: web (Next.js App Router)
   → Structure Decision: Documentation-only feature (OpenAPI/Postman artifacts)
3. Fill Constitution Check ✅
4. Evaluate Constitution Check ✅
   → No violations - documentation feature, no code implementation
5. Execute Phase 0 → research.md ✅
6. Execute Phase 1 → contracts, data-model.md, quickstart.md ✅
7. Re-evaluate Constitution Check ✅
   → PASS - No new violations
8. Plan Phase 2 → Task generation approach described ✅
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Create a consolidated OpenAPI 3.1.0 specification and Postman Collection v2.1 documenting all 56 API endpoints of the Hemera learning platform. The specification will be organized by logical tags (Public, Auth, Bookings, Courses, Locations, Admin, Webhooks, Monitoring) with complete request/response schemas, authentication documentation, and example payloads. The Postman collection will include pre-request scripts for automatic auth header injection and environment templates for dev/staging/prod.

## Technical Context

**Language/Version**: YAML (OpenAPI 3.1.0), JSON (Postman Collection v2.1)
**Primary Dependencies**: Spectral (OpenAPI linting), openapi-to-postmanv2 (conversion)
**Storage**: Static files in repository (docs/api/)
**Testing**: Spectral linting, Postman collection runner
**Target Platform**: Any OpenAPI-compatible tool, Postman desktop/web
**Project Type**: web (documentation artifacts for existing Next.js 15.5.6 API)
**Performance Goals**: N/A (static documentation)
**Constraints**: OpenAPI 3.1.0 compliance, Postman Collection v2.1 format
**Scale/Scope**: 56 API endpoints, 8 logical tags, ~15 reusable schemas

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
|------|--------|-------|
| Test-First Development | ✅ N/A | Documentation feature - no runtime code |
| Code Quality & Formatting | ✅ PASS | YAML/JSON will be linted via Spectral |
| Feature Development Workflow | ✅ PASS | Spec-first approach followed |
| Error Handling & Observability | ✅ N/A | No runtime code |
| Authentication & Security | ✅ PASS | Security schemes documented, no secrets exposed |
| Stripe Integration | ✅ PASS | Payment endpoints documented with proper schemas |
| Deployment Standards | ✅ N/A | Static documentation files |
| GitHub Actions | ✅ N/A | No deployment workflow needed |

**Constitution Compliance**: PASS - This is a documentation-only feature that generates static OpenAPI and Postman files. No runtime code, no database changes, no security risks.

## Project Structure

### Documentation (this feature)

```
specs/019-OpenAPI-Postman/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output - OpenAPI/Postman best practices
├── data-model.md        # Phase 1 output - Schema definitions
├── quickstart.md        # Phase 1 output - Import & usage guide
├── contracts/           # Phase 1 output - OpenAPI fragments per tag
└── tasks.md             # Phase 2 output (/tasks command)
```

### Output Artifacts (repository root)

```
docs/
└── api/
    ├── openapi.yaml           # Consolidated OpenAPI 3.1.0 specification
    ├── hemera.postman.json    # Postman Collection v2.1
    ├── hemera.env.json        # Postman Environment template
    └── README.md              # Import guide & troubleshooting
```

**Structure Decision**: Documentation-only feature. Output artifacts go to `docs/api/` for easy discovery. No source code changes required.

## Phase 0: Outline & Research

Research completed. Key findings consolidated in [research.md](research.md).

### Research Topics Addressed

1. **OpenAPI 3.1.0 Best Practices** → Structure, `$ref` usage, security schemes
2. **Postman Collection v2.1 Format** → Folder organization, pre-request scripts
3. **Spectral Linting Configuration** → Ruleset for API consistency
4. **openapi-to-postmanv2 Conversion** → Automated collection generation
5. **Existing Hemera API Inventory** → 56 endpoints across 8 tags

**Output**: [research.md](research.md) ✅

## Phase 1: Design & Contracts

### 1. Schema Definitions → [data-model.md](data-model.md)

Reusable OpenAPI component schemas extracted from existing API routes:
- Course, Booking, Location, User entities
- StandardResponse wrapper (`success`, `data`, `error`, `code`, `requestId`)
- Error schemas (ValidationError, AuthError, NotFoundError)
- Pagination schema

### 2. API Contracts → [contracts/](contracts/)

OpenAPI fragments organized by tag:
- `public.yaml` - Health, Courses (public), Locations (public)
- `auth.yaml` - Authentication providers
- `bookings.yaml` - Booking CRUD
- `courses.yaml` - Course participation phases
- `locations.yaml` - Location CRUD (admin)
- `admin.yaml` - Admin endpoints (courses, users, analytics)
- `webhooks.yaml` - Stripe webhook receivers
- `monitoring.yaml` - Vitals, deployment health

### 3. Quickstart Guide → [quickstart.md](quickstart.md)

Step-by-step instructions for:
- Importing OpenAPI spec into Swagger UI / Postman
- Configuring Postman environment variables
- Obtaining Clerk JWT tokens for authenticated requests
- Running first API request

### 4. Agent Context Update

Execute: `.specify/scripts/bash/update-agent-context.sh copilot`

**Output**: data-model.md, contracts/*, quickstart.md ✅

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

1. **Setup Tasks**
   - Create `docs/api/` directory structure
   - Install Spectral CLI for linting
   - Configure `.spectral.yaml` ruleset

2. **Schema Tasks** (from data-model.md)
   - Create `components/schemas/` section in OpenAPI
   - Define each entity schema (Course, Booking, Location, User, etc.)
   - Define StandardResponse and Error schemas

3. **Endpoint Documentation Tasks** (from contracts/)
   - Document each tag group (8 tags × ~7 endpoints avg = ~56 tasks)
   - Each endpoint: path, method, parameters, request body, responses, examples
   - Mark [P] for parallel execution within same tag

4. **Postman Generation Tasks**
   - Convert OpenAPI to Postman Collection via openapi-to-postmanv2
   - Add pre-request scripts for auth header injection
   - Create environment template with variables
   - Add basic response validation tests

5. **Validation Tasks**
   - Run Spectral linting on final OpenAPI spec
   - Validate Postman collection import
   - Test sample requests against local dev server

**Ordering Strategy**:
- Setup → Schemas → Endpoints (by tag) → Postman → Validation
- Parallel execution [P] for independent endpoint documentation
- Sequential for validation (depends on all prior)

**Estimated Output**: 20-25 numbered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_No violations - documentation-only feature requires no complexity justifications._

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None | N/A | N/A |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) → 24 tasks in tasks.md
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---

_Based on Constitution v1.7.0 - See `.specify/memory/constitution.md`_
