# Tasks: OpenAPI 3.1 & Postman Collection

**Input**: Design documents from `/specs/019-OpenAPI-Postman/`  
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Flow

```
1. Load plan.md from feature directory ✅
   → Tech stack: YAML (OpenAPI 3.1.0), JSON (Postman Collection v2.1)
   → Libraries: Spectral (linting), openapi-to-postmanv2 (conversion)
   → Structure: Documentation-only feature (docs/api/)
2. Load design documents ✅
   → data-model.md: 15 schemas (Course, Booking, Location, User, etc.)
   → contracts/: 8 files (public, auth, bookings, courses, locations, admin, webhooks, monitoring)
   → research.md: 56 endpoints across 8 tags
   → quickstart.md: Import & test scenarios
3. Generate tasks by category ✅
   → Setup: 3 tasks (directory, Spectral, base file)
   → Validation Tests: 2 tasks (Spectral lint, Postman import)
   → Schemas: 4 tasks (core, entities, phases, deprecated)
   → Endpoint Documentation: 8 tasks (one per contract file)
   → Postman Generation: 4 tasks (convert, scripts, env, tests)
   → Polish: 3 tasks (README, sample requests, cleanup)
4. Apply task rules ✅
   → Contract files → parallel documentation tasks [P]
   → Schema groups → parallel [P] (different sections)
   → Postman tasks → sequential (dependencies)
5. Number tasks: T001-T024
6. Dependencies mapped
7. Parallel examples included
8. Validation: All contracts covered, all schemas covered
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All paths relative to repository root

---

## Phase 3.1: Setup

- [ ] T001 Create output directory structure `docs/api/` with README placeholder
- [ ] T002 Install Spectral CLI and create `.spectral.yaml` linting configuration
- [ ] T003 Create base OpenAPI file `docs/api/openapi.yaml` with info, servers, security schemes

### T001 Details
```
Files: docs/api/README.md
Action: Create directory and placeholder README
```

### T002 Details
```
Files: .spectral.yaml
Action: Configure Spectral with spectral:oas ruleset + custom rules for Hemera conventions
Command: npm install -D @stoplight/spectral-cli
```

### T003 Details
```
Files: docs/api/openapi.yaml
Action: Create OpenAPI 3.1.0 base structure with:
  - openapi: '3.1.0'
  - info (title: Hemera API, version: 1.0.0)
  - servers (dev, staging, prod)
  - security schemes (clerkAuth Bearer JWT)
  - tags (Public, Auth, Bookings, Courses, Locations, Admin, Webhooks, Monitoring)
```

---

## Phase 3.2: Validation Tests First ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These validation tests MUST be defined before documentation begins**

- [ ] T004 Define Spectral linting rules for API consistency in `.spectral.yaml`
- [ ] T005 [P] Create Postman import validation test script `scripts/validate-postman-import.js`

### T004 Details
```
Files: .spectral.yaml
Rules to enforce:
  - operation-operationId: All operations must have operationId
  - operation-tags: All operations must have tags
  - oas3-schema: Valid OpenAPI 3.1.0
  - no-$ref-siblings: Clean $ref usage
  - Custom: response-must-have-requestId (Hemera convention)
```

### T005 Details
```
Files: scripts/validate-postman-import.js
Action: Script that:
  1. Runs openapi-to-postmanv2 conversion
  2. Validates collection JSON structure
  3. Checks all endpoints have examples
  4. Reports missing auth header configurations
```

---

## Phase 3.3: Schema Documentation

- [ ] T006 [P] Document core response schemas in `docs/api/openapi.yaml` components/schemas (StandardResponse, ErrorResponse)
- [ ] T007 [P] Document entity schemas in `docs/api/openapi.yaml` components/schemas (Course, CourseSummary, Booking, Location, User, UserProfile)
- [ ] T008 [P] Document participation phase schemas in `docs/api/openapi.yaml` components/schemas (PreparationPhase, SummaryPhase, DebriefingPhase, ResultPhase, Resume)
- [ ] T009 [P] Document utility schemas in `docs/api/openapi.yaml` components/schemas (Pagination, HealthCheck, PaymentIntent, CheckoutSession)

### T006-T009 Details
```
Source: specs/019-OpenAPI-Postman/data-model.md
Target: docs/api/openapi.yaml → components/schemas/
Note: All [P] tasks write to different schema sections - can run in parallel
```

---

## Phase 3.4: Endpoint Documentation (by Tag)

Each task documents one tag group from contracts/ into openapi.yaml paths section.

- [ ] T010 [P] Document Public endpoints (health, courses list, locations list) from `contracts/public.yaml` → `docs/api/openapi.yaml` paths
- [ ] T011 [P] Document Auth endpoints (providers) from `contracts/auth.yaml` → `docs/api/openapi.yaml` paths
- [ ] T012 [P] Document Bookings endpoints (CRUD) from `contracts/bookings.yaml` → `docs/api/openapi.yaml` paths
- [ ] T013 [P] Document Courses participation endpoints from `contracts/courses.yaml` → `docs/api/openapi.yaml` paths
- [ ] T014 [P] Document Locations endpoints (CRUD, geocode) from `contracts/locations.yaml` → `docs/api/openapi.yaml` paths
- [ ] T015 [P] Document Admin endpoints (courses, users, analytics) from `contracts/admin.yaml` → `docs/api/openapi.yaml` paths
- [ ] T016 [P] Document Webhooks endpoints (Stripe, Clerk) from `contracts/webhooks.yaml` → `docs/api/openapi.yaml` paths
- [ ] T017 [P] Document Monitoring endpoints (vitals) from `contracts/monitoring.yaml` → `docs/api/openapi.yaml` paths

### T010-T017 Details
```
Source: specs/019-OpenAPI-Postman/contracts/*.yaml
Target: docs/api/openapi.yaml → paths/
Action: Copy path definitions, add examples, verify $ref references
Note: All [P] tasks document different paths - can run in parallel
```

---

## Phase 3.5: Postman Collection Generation

- [ ] T018 Convert OpenAPI to Postman Collection using openapi-to-postmanv2 → `docs/api/hemera.postman.json`
- [ ] T019 Add pre-request script for automatic Bearer token injection to collection
- [ ] T020 Create Postman environment template `docs/api/hemera.env.json` with dev/staging/prod variables
- [ ] T021 Add basic response validation tests to Postman collection (status codes, response structure)

### T018 Details
```
Command: npx openapi-to-postmanv2 -s docs/api/openapi.yaml -o docs/api/hemera.postman.json
Verify: Collection structure, folder organization matches tags
```

### T019 Details
```
Files: docs/api/hemera.postman.json
Action: Add collection-level pre-request script:
  if (pm.environment.get('clerkToken')) {
    pm.request.headers.add({
      key: 'Authorization',
      value: 'Bearer ' + pm.environment.get('clerkToken')
    });
  }
```

### T020 Details
```
Files: docs/api/hemera.env.json
Variables:
  - baseUrl (dev: http://localhost:3000/api, staging: https://staging.hemera.app/api, prod: https://hemera.app/api)
  - clerkToken (empty, user fills)
  - courseId, bookingId, locationId, userId (empty, for dynamic use)
```

### T021 Details
```
Files: docs/api/hemera.postman.json
Action: Add test scripts to key requests:
  - pm.test("Status code is 2xx", () => pm.response.to.be.success);
  - pm.test("Response has success field", () => pm.expect(pm.response.json().success).to.exist);
```

---

## Phase 3.6: Polish & Validation

- [ ] T022 [P] Create comprehensive `docs/api/README.md` with import instructions, auth setup, troubleshooting
- [ ] T023 Run Spectral linting on final `docs/api/openapi.yaml` and fix any violations
- [ ] T024 Execute quickstart.md validation: Import into Postman, test sample requests against dev server

### T022 Details
```
Files: docs/api/README.md
Content:
  - Quick import instructions (copy from quickstart.md)
  - Environment setup guide
  - How to get Clerk JWT tokens
  - Troubleshooting common errors (401, 404, CORS)
  - Links to Hemera documentation
```

### T023 Details
```
Command: npx spectral lint docs/api/openapi.yaml
Expected: 0 errors, 0 warnings
Fix: Any violations before proceeding
```

### T024 Details
```
Action: Manual validation following specs/019-OpenAPI-Postman/quickstart.md
Steps:
  1. Import openapi.yaml into Postman
  2. Import hemera.env.json
  3. Test GET /health (should return 200)
  4. Get Clerk token, test GET /bookings (should return 200)
  5. Verify collection folder structure matches 8 tags
```

---

## Dependencies

```
Setup (T001-T003) → must complete first
  ↓
Validation Tests (T004-T005) → define before implementation
  ↓
Schemas (T006-T009) [P] → can run in parallel
  ↓
Endpoints (T010-T017) [P] → can run in parallel, need schemas
  ↓
Postman (T018-T021) → sequential, need complete OpenAPI
  ↓
Polish (T022-T024) → need Postman collection
```

### Blocking Dependencies

| Task | Blocked By | Reason |
|------|------------|--------|
| T006-T009 | T003 | Need base openapi.yaml structure |
| T010-T017 | T006-T009 | Need schema $refs to exist |
| T018 | T010-T017 | Need complete paths section |
| T019-T021 | T018 | Need generated collection |
| T023-T024 | T018-T021 | Final validation |

---

## Parallel Execution Examples

### Schema Tasks (T006-T009)
```
# Launch all schema tasks together after T003:
Task: "Document core response schemas (StandardResponse, ErrorResponse)"
Task: "Document entity schemas (Course, Booking, Location, User)"
Task: "Document participation phase schemas (Preparation, Summary, Debriefing, Result)"
Task: "Document utility schemas (Pagination, HealthCheck, PaymentIntent)"
```

### Endpoint Documentation Tasks (T010-T017)
```
# Launch all endpoint tasks together after schemas complete:
Task: "Document Public endpoints from contracts/public.yaml"
Task: "Document Auth endpoints from contracts/auth.yaml"
Task: "Document Bookings endpoints from contracts/bookings.yaml"
Task: "Document Courses endpoints from contracts/courses.yaml"
Task: "Document Locations endpoints from contracts/locations.yaml"
Task: "Document Admin endpoints from contracts/admin.yaml"
Task: "Document Webhooks endpoints from contracts/webhooks.yaml"
Task: "Document Monitoring endpoints from contracts/monitoring.yaml"
```

---

## Notes

- **[P] tasks**: Different sections of same file or different files - safe to parallelize
- **Documentation feature**: No runtime code, no tests to fail - validation is Spectral linting
- **Commit strategy**: Commit after each phase completion
- **Existing fragments**: Merge with existing specs from 007 and 015 if applicable

---

## Validation Checklist

_GATE: Check before marking tasks.md complete_

- [x] All 8 contract files have corresponding endpoint documentation tasks (T010-T017)
- [x] All 15 schemas from data-model.md covered in schema tasks (T006-T009)
- [x] Validation tests defined before implementation (T004-T005)
- [x] Parallel tasks truly independent (different file sections)
- [x] Each task specifies exact file paths
- [x] No task modifies same file section as another [P] task
- [x] Postman generation tasks are sequential (T018 → T019 → T020 → T021)
- [x] Final validation includes quickstart.md scenarios (T024)

---

## Task Summary

| Phase | Tasks | Parallel | Sequential |
|-------|-------|----------|------------|
| Setup | T001-T003 | 0 | 3 |
| Validation Tests | T004-T005 | 1 | 1 |
| Schemas | T006-T009 | 4 | 0 |
| Endpoints | T010-T017 | 8 | 0 |
| Postman | T018-T021 | 0 | 4 |
| Polish | T022-T024 | 1 | 2 |
| **Total** | **24** | **14** | **10** |

---

_Generated from design documents. Based on Constitution v1.7.0_
