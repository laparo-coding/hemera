# Implementation Plan: Course Locations

**Branch**: `015-course-locations` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-course-locations/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   ✓ Loaded: specs/015-course-locations/spec.md
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   ✓ All clarified in session 2025-12-23
   → Project Type: web (Next.js App Router)
   → Structure Decision: Existing monorepo structure
3. Fill the Constitution Check section
   ✓ Completed based on constitution.md
4. Evaluate Constitution Check section
   ✓ No violations - design is compliant
5. Execute Phase 0 → research.md
   ✓ Completed
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   ✓ Completed
7. Re-evaluate Constitution Check section
   ✓ No new violations
8. Plan Phase 2 → Describe task generation approach
   ✓ Described (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
   ✓ Complete
```

## Summary

Create a Location entity for storing venue/location information for courses, including:
- **Database**: Location model with Prisma (16 fields, one-to-many relationship with Course)
- **API**: RESTful CRUD endpoints at `/api/locations` with admin authorization
- **Admin UI**: Location management page at `/admin/locations` following Course admin pattern
- **Landing Page**: Public location detail page at `/locations/[slug]` with Leaflet map integration
- **Geocoding**: Nominatim API for address-to-coordinates conversion

## Technical Context

**Language/Version**: TypeScript 5+, Next.js 15.5.6 (App Router), React 18+
**Primary Dependencies**: MUI v5, Clerk (auth), Prisma (ORM), React Leaflet, Leaflet
**Storage**: PostgreSQL with Prisma ORM
**Testing**: Jest for unit tests, Playwright for E2E
**Target Platform**: Vercel (serverless)
**Project Type**: web (monorepo with frontend+backend in same Next.js app)
**Performance Goals**: < 3 seconds page load on 3G (FR-LP-029)
**Constraints**: DSGVO-compliant (no Google Maps), Nominatim rate limit 1 req/sec
**Scale/Scope**: ~10-50 locations expected, admin-only write access

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
|------|--------|-------|
| Test-First Development | ✅ Pass | Contract tests planned before implementation |
| Code Quality (Prettier/ESLint) | ✅ Pass | Standard tooling applies |
| Clerk Authentication | ✅ Pass | Admin routes require auth (FR-API-006/007) |
| Prisma Migrations | ✅ Pass | Location model requires migration |
| Error Handling | ✅ Pass | Rollbar integration for API errors |
| MUI Design System | ✅ Pass | Admin page uses MUI (FR-ADM-023) |
| WCAG 2.1 AA Accessibility | ✅ Pass | Alt text, touch targets defined (FR-LP-019/022) |
| GitHub Actions Deployment | ✅ Pass | Standard workflow applies |

## Project Structure

### Documentation (this feature)

```
specs/015-course-locations/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── locations-api.yaml
│   └── location-schemas.ts
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)

```
prisma/
├── schema.prisma        # Add Location model
└── migrations/          # New migration for locations table

app/
├── api/
│   └── locations/
│       ├── route.ts             # GET all, POST create
│       └── [id]/
│           └── route.ts         # GET one, PUT update, DELETE
├── locations/
│   └── [slug]/
│       └── page.tsx             # Public landing page
└── admin/
    └── locations/
        ├── page.tsx             # Locations list
        ├── new/
        │   └── page.tsx         # Create location form
        └── [id]/
            └── edit/
                └── page.tsx     # Edit location form

components/
├── LocationCard.tsx             # Reusable location card
├── LocationForm.tsx             # Create/edit form
├── LocationMap.tsx              # Leaflet map component
└── admin/
    └── LocationsTable.tsx       # Admin list table

lib/
├── services/
│   └── location-service.ts      # Business logic
├── schemas/
│   └── location-schema.ts       # Zod validation
└── utils/
    └── geocoding.ts             # Nominatim API wrapper

tests/
├── unit/
│   ├── location-schema.spec.ts
│   ├── location-service.spec.ts
│   └── geocoding.spec.ts
├── integration/
│   └── locations-api.spec.ts
└── e2e/
    └── locations.spec.ts
```

**Structure Decision**: Follows existing Next.js App Router pattern. API routes in `/app/api/locations/`, admin pages in `/app/admin/locations/`, public pages in `/app/locations/`.

## Phase 0: Outline & Research

### Research Tasks Completed

1. **Map Integration** → React Leaflet + OpenStreetMap (documented in spec)
2. **Geocoding** → Nominatim API (documented in spec)
3. **Slug Generation** → Same pattern as Course entity (auto-generated from name)
4. **Website Scanning** → Deferred to Phase 2 (manual entry only for MVP)

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Map Library | React Leaflet | Free, DSGVO-compliant, OSM integration |
| Geocoding | Nominatim API | Free, OSM-consistent, cached in DB |
| Slug Strategy | Auto from name | Matches Course pattern |
| Image Storage | URL only | Matches Course thumbnailUrl pattern |
| Admin Workflow | Manual entry | Website scanning deferred to Phase 2 |

**Output**: [research.md](./research.md)

## Phase 1: Design & Contracts

### Data Model

**Location Entity** (16 fields):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String (CUID) | Auto | Primary key |
| slug | String | Auto | Unique, from name |
| name | String | Yes | Display name |
| description | String | No | Venue description |
| address | String | Yes | Street address |
| zipCode | String | No | Postal code |
| city | String | Yes | City name |
| email | String | No | Contact email (validated) |
| phone | String | No | Contact phone |
| website | String | No | Website URL (validated) |
| imageUrl | String | No | Exterior image URL |
| roomImageUrl | String | No | Interior image URL |
| latitude | Float | No | From Nominatim |
| longitude | Float | No | From Nominatim |
| createdAt | DateTime | Auto | Timestamp |
| updatedAt | DateTime | Auto | Timestamp |

**Relationship**: Course → Location (optional FK `locationId`)

**Output**: [data-model.md](./data-model.md)

### API Contracts

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/locations` | GET | Public | List all locations |
| `/api/locations` | POST | Admin | Create location |
| `/api/locations/[id]` | GET | Public | Get single location |
| `/api/locations/[id]` | PUT | Admin | Update location |
| `/api/locations/[id]` | DELETE | Admin | Delete (if no refs) |
| `/api/locations/geocode` | POST | Admin | Geocode address |

**Output**: [contracts/locations-api.yaml](./contracts/locations-api.yaml)

### Quickstart Test Scenarios

1. **Create Location**: Admin creates "Yoga Studio Berlin" → appears in list
2. **View Landing Page**: Navigate to `/locations/yoga-studio-berlin` → see map, address
3. **Edit Location**: Update address → coordinates auto-refresh
4. **Delete Blocked**: Try delete location with course → error with course list
5. **Map Interaction**: Click Apple/Google Maps buttons → open navigation

**Output**: [quickstart.md](./quickstart.md)

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

1. **Foundation Tasks** (Database & Schema):
   - Add Location model to Prisma schema
   - Create migration
   - Add Zod validation schema
   - Add location service

2. **API Tasks** (Contracts First):
   - Contract tests for all endpoints
   - GET /api/locations implementation
   - POST /api/locations implementation
   - GET /api/locations/[id] implementation
   - PUT /api/locations/[id] implementation
   - DELETE /api/locations/[id] implementation
   - Geocoding utility

3. **Admin UI Tasks**:
   - Locations list page
   - Create location form
   - Edit location form
   - LocationsTable component
   - LocationForm component

4. **Public UI Tasks**:
   - Location landing page
   - LocationMap component (Leaflet)
   - LocationCard component

5. **Integration Tasks**:
   - Add locationId to Course model
   - Update Course admin to select location
   - Link from Course detail to Location page

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Schema → Service → API → Components → Pages
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

## Phase 3+: Future Implementation

_Executed by /implement or manual development_

- Task execution in dependency order
- Continuous test validation
- PR review and deployment

---

## Progress Tracking

| Phase | Status | Artifacts |
|-------|--------|-----------|
| Phase 0: Research | ✅ Complete | research.md |
| Phase 1: Design | ✅ Complete | data-model.md, contracts/, quickstart.md |
| Phase 2: Tasks | ⏳ Pending | /tasks command |
| Phase 3+: Impl | ⏳ Pending | Source code |

---

## Next Steps

Run `/tasks` to generate the task breakdown in `tasks.md`.
