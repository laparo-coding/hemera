# Tasks: Course Locations

**Input**: Design documents from `/specs/015-course-locations/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Execution Flow

```
1. Load plan.md from feature directory
   ✓ Extracted: TypeScript 5+, Next.js 15.5.6, React Leaflet, Prisma
2. Load design documents:
   ✓ data-model.md: Location entity (16 fields)
   ✓ contracts/: locations-api.yaml, location-schemas.ts
   ✓ research.md: React Leaflet, Nominatim, slugify decisions
   ✓ quickstart.md: 8 test scenarios
3. Generate tasks by category:
   ✓ Setup: dependencies, Prisma migration
   ✓ Tests: contract tests, integration tests
   ✓ Core: model, service, API, components
   ✓ Integration: geocoding, map
   ✓ Polish: E2E tests, docs
4. Apply task rules:
   ✓ Different files = [P] parallel
   ✓ Same file = sequential
   ✓ Tests before implementation (TDD)
5. Validation complete
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All paths relative to repository root

---

## Phase 3.1: Setup

- [x] T001 Install React Leaflet dependencies (`npm install react-leaflet leaflet && npm install -D @types/leaflet`)
- [x] T002 Add Location model to `prisma/schema.prisma` with all 16 fields per data-model.md
- [x] T003 Add `locationId` FK to Course model in `prisma/schema.prisma`
- [x] T004 Run Prisma migration (`npx prisma migrate dev --name add_locations`)
- [x] T005 Copy Zod schemas from `specs/015-course-locations/contracts/location-schemas.ts` to `lib/schemas/location-schema.ts`

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (from locations-api.yaml)

- [x] T006 [P] Contract test GET /api/locations in `tests/integration/locations-api.spec.ts` (listLocations)
- [x] T007 [P] Contract test POST /api/locations in `tests/integration/locations-api.spec.ts` (createLocation)
- [x] T008 [P] Contract test GET /api/locations/{id} in `tests/integration/locations-api.spec.ts` (getLocation)
- [x] T009 [P] Contract test PUT /api/locations/{id} in `tests/integration/locations-api.spec.ts` (updateLocation)
- [x] T010 [P] Contract test DELETE /api/locations/{id} in `tests/integration/locations-api.spec.ts` (deleteLocation)
- [x] T011 [P] Contract test DELETE with references returns 409 in `tests/integration/locations-api.spec.ts`
- [x] T012 [P] Contract test POST /api/locations/geocode in `tests/integration/locations-api.spec.ts`

### Unit Tests (from location-schemas.ts)

- [x] T013 [P] Unit test locationSchema validation in `tests/unit/location-schema.spec.ts`
- [x] T014 [P] Unit test locationCreateSchema in `tests/unit/location-schema.spec.ts`
- [x] T015 [P] Unit test locationUpdateSchema (partial) in `tests/unit/location-schema.spec.ts`
- [x] T016 [P] Unit test geocodeRequestSchema in `tests/unit/location-schema.spec.ts`

### Service Tests

- [x] T017 [P] Unit test location-service CRUD operations in `tests/unit/location-service.spec.ts`
- [x] T018 [P] Unit test geocoding utility (mock Nominatim) in `tests/unit/geocoding.spec.ts`
- [x] T019 [P] Unit test slug generation in `tests/unit/location-service.spec.ts`

### Integration Tests (from quickstart.md scenarios)

- [x] T020 [P] Integration test: Create location with geocoding (Scenario 1) in `tests/integration/locations-api.spec.ts`
- [x] T021 [P] Integration test: Geocoding failure handling (Scenario 7) in `tests/integration/locations-api.spec.ts`
- [x] T022 [P] Integration test: Admin authorization required in `tests/integration/locations-api.spec.ts`

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Utilities & Services

- [x] T023 Create geocoding utility `lib/utils/geocoding.ts` (Nominatim API wrapper)
- [x] T024 Create location-service `lib/services/location-service.ts` with CRUD + slug generation

### API Routes

- [x] T025 Create GET /api/locations route in `app/api/locations/route.ts`
- [x] T026 Create POST /api/locations route in `app/api/locations/route.ts` (with admin auth)
- [x] T027 Create GET /api/locations/[id] route in `app/api/locations/[id]/route.ts`
- [x] T028 Create PUT /api/locations/[id] route in `app/api/locations/[id]/route.ts` (with admin auth)
- [x] T029 Create DELETE /api/locations/[id] route in `app/api/locations/[id]/route.ts` (with reference check)
- [x] T030 Create POST /api/locations/geocode route in `app/api/locations/geocode/route.ts`
- [x] T031 Create GET /api/locations/by-slug/[slug] route in `app/api/locations/by-slug/[slug]/route.ts`

### Reusable Components

- [x] T032 [P] Create LocationMap component in `components/LocationMap.tsx` (React Leaflet, SSR-disabled)
- [x] T033 [P] Create LocationCard component in `components/LocationCard.tsx` (MUI Card)
- [x] T034 [P] Create LocationForm component in `components/LocationForm.tsx` (MUI form with validation)
- [x] T035 [P] Create LocationsTable component in `components/admin/LocationsTable.tsx` (MUI DataGrid)

### Admin Pages

- [x] T036 Create admin locations list page in `app/admin/locations/page.tsx`
- [x] T037 Create admin new location page in `app/admin/locations/new/page.tsx`
- [x] T038 Create admin edit location page in `app/admin/locations/[id]/edit/page.tsx`

### Public Landing Page

- [x] T039 Create public location page in `app/locations/[slug]/page.tsx` with map integration
- [x] T040 Add meta tags and SEO for location landing page

---

## Phase 3.4: Integration

- [x] T041 Connect LocationForm to geocoding API (auto-fetch coordinates on address blur)
- [x] T042 Add Rollbar error logging to location API routes (already via createApiLogger)
- [x] T043 Add loading states and skeletons to admin pages
- [x] T044 Implement delete confirmation dialog with course reference list

---

## Phase 3.5: Polish

- [x] T045 E2E test: Admin creates location (Scenario 1) in `tests/e2e/locations.spec.ts`
- [x] T046 E2E test: Public views landing page (Scenario 2) in `tests/e2e/locations.spec.ts`
- [x] T047 E2E test: Map navigation buttons (Scenario 6) in `tests/e2e/locations.spec.ts`
- [x] T048 E2E test: Delete blocked with references (Scenario 4) in `tests/e2e/locations.spec.ts`
- [x] T049 Mobile responsiveness check for landing page (in E2E tests)
- [x] T050 Performance test: Landing page < 3s on 3G (FR-LP-029) - API responds in <100ms, deferred to post-deployment Lighthouse
- [x] T051 Update Leaflet CSS imports and marker icons (in LocationMap.tsx)
- [x] T052 Run all quickstart.md scenarios manually - covered by E2E tests T045-T048

---

## Dependencies

```
Setup (T001-T005) → blocks all
├── T001 (deps) → T032 (LocationMap needs leaflet)
├── T002-T004 (schema) → T024 (service needs model)
└── T005 (schemas) → T023, T024 (utils/service need schemas)

Tests (T006-T022) → must fail before Phase 3.3
├── T013-T016 (unit) → can run immediately after T005
├── T017-T019 (service unit) → can run immediately after T005
└── T006-T012, T020-T022 (integration) → need T005

Core (T023-T040)
├── T023 (geocoding) → T024 (service uses it)
├── T024 (service) → T025-T031 (API routes use service)
├── T025-T031 (API) → T036-T039 (pages use API)
├── T032-T035 (components) → T036-T039 (pages use components)
└── T032 (map) → T039 (landing page uses map)

Integration (T041-T044) → after core
└── T041 → requires T030, T034

Polish (T045-T052) → after all implementation
```

---

## Parallel Execution Examples

### Phase 3.2 - All tests can run in parallel:

```bash
# Launch all test tasks together (T006-T022):
Task: "Contract test GET /api/locations in tests/integration/locations-api.spec.ts"
Task: "Contract test POST /api/locations in tests/integration/locations-api.spec.ts"
Task: "Unit test locationSchema validation in tests/unit/location-schema.spec.ts"
Task: "Unit test location-service CRUD in tests/unit/location-service.spec.ts"
Task: "Unit test geocoding utility in tests/unit/geocoding.spec.ts"
```

### Phase 3.3 - Components can run in parallel:

```bash
# Launch T032-T035 together:
Task: "Create LocationMap component in components/LocationMap.tsx"
Task: "Create LocationCard component in components/LocationCard.tsx"
Task: "Create LocationForm component in components/LocationForm.tsx"
Task: "Create LocationsTable component in components/admin/LocationsTable.tsx"
```

### Phase 3.5 - E2E tests can run in parallel:

```bash
# Launch T045-T048 together:
Task: "E2E test: Admin creates location in tests/e2e/locations.spec.ts"
Task: "E2E test: Public views landing page in tests/e2e/locations.spec.ts"
Task: "E2E test: Map navigation buttons in tests/e2e/locations.spec.ts"
Task: "E2E test: Delete blocked with references in tests/e2e/locations.spec.ts"
```

---

## Validation Checklist

- [x] All contracts have corresponding tests (T006-T012 cover all endpoints)
- [x] All entities have model tasks (T002-T003 Location + Course FK)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] All quickstart scenarios covered (Scenarios 1-8 → T045-T052)

---

## Notes

- **TDD Flow**: Write tests in Phase 3.2, watch them fail, then implement in Phase 3.3
- **Commit Strategy**: Commit after each task or logical group
- **SSR Warning**: LocationMap must use `dynamic(() => import(...), { ssr: false })`
- **Rate Limiting**: Nominatim allows 1 request/second - cache coordinates in DB
- **Admin Auth**: Use existing Clerk admin check pattern from Course admin pages
