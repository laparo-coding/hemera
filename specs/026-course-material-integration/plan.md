# Implementation Plan: Course Material Integration (026)

**Branch**: `026-course-material-integration` | **Date**: 2026-03-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/026-course-material-integration/spec.md`

## Summary

Extend the course-material admin surface (Spec 023) with a material type system. Admins choose
between (A) rich-text content pages (existing WYSIWYG editor) and (B) slide control HTML file
uploads (new). A `type` field on `CourseMaterial` distinguishes the two. The list page shows type
badges; the edit page renders type-appropriate UI. Robustness, accessibility, design-token, and i18n
hardening was completed as a prerequisite.

## Technical Context

**Language/Version**: TypeScript 5.9
**Primary Dependencies**: Next.js 16 (App Router), React 19, MUI v5, Clerk auth, Prisma 7.3, Zod, @vercel/blob
**Storage**: PostgreSQL via Prisma, Vercel Blob for HTML file storage
**Testing**: Jest (unit + contract), Playwright (E2E)
**Target Platform**: Vercel (serverless), Web
**Project Type**: Web (single Next.js app with API routes)
**Performance Goals**: Admin tool — no hard latency targets; standard < 2s page load
**Constraints**: File upload ≤ 20 MB, HTML files only, Clerk admin auth required
**Scale/Scope**: ~100s of materials, single-admin concurrent usage

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
|------|--------|-------|
| Test-First Development | PASS | Contract tests for new API variants, unit tests for schemas |
| Code Quality & Formatting | PASS | Biome lint/format, TypeScript strict |
| Feature Development Workflow | PASS | Spec → Plan → Tasks → Implementation |
| Error Handling & Observability | PASS | Rollbar for all server errors, no console.error |
| Authentication & Security | PASS | `requireAdminUser()` on all endpoints |
| Component Architecture | PASS | MUI + design tokens, WCAG 2.1 AA, keyboard nav |
| Deployment Standards | PASS | GitHub Actions only, no manual deploys |
| Stripe Integration | N/A | No payment flows affected |

## Project Structure

### Documentation (this feature)

```
specs/026-course-material-integration/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-contracts.md # Phase 1 output
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)

```
prisma/
├── schema.prisma                              # Add type field to CourseMaterial
└── migrations/…_add_material_type/            # New migration

app/
├── admin/course-material/
│   ├── page.tsx                               # List page (add type badge)
│   └── new/
│       ├── page.tsx                           # Server component (dynamic import wrapper)
│       └── create-client.tsx                  # NEW: client component (type selection + forms)
│   └── [id]/edit/
│       ├── page.tsx                           # Edit page wrapper (no change)
│       └── edit-client.tsx                    # Edit client (type branching)
├── api/admin/course-material/
│   ├── route.ts                               # POST: add FormData variant
│   └── [id]/route.ts                          # GET: add type+blob fields; PUT: add FormData variant

components/admin/
├── MaterialTypeSelector.tsx                   # NEW: type selection cards
├── SlideControlUploadForm.tsx                 # NEW: file upload form
├── CourseMaterialTable.tsx                    # Extend: type badge chip
└── MaterialForm.tsx                           # No change

lib/
├── schemas/admin/course-material.ts           # Extend: type field, file validation constants
├── api/course-material.ts                     # Extend: createMaterial with type param
└── design-tokens.ts                           # Already extended (prerequisite)

tests/
├── contracts/course-material-api.spec.ts      # Extend: FormData POST/PUT tests
└── unit/schemas/course-material.spec.ts       # Extend: type field + file validation tests
```

**Structure Decision**: Single Next.js web application. All source under `app/`, `components/`,
`lib/`, `prisma/`. Tests under `tests/`. No separate backend/frontend split.

## Phase 0: Outline & Research

All unknowns resolved. See [research.md](research.md).

Key decisions:
1. **Type discrimination**: `type` column on `CourseMaterial` (String, default `"CONTENT"`)
2. **Upload pattern**: Extend existing POST endpoint with FormData detection via Content-Type header
3. **File validation**: Server-side HTML extension + MIME + size check; no sanitization for SLIDE_CONTROL
4. **List page**: MUI Chip badge, no filter
5. **Edit page**: Single route, conditional rendering based on `type`

## Phase 1: Design & Contracts

_Prerequisites: research.md complete ✅_

### Data Model

See [data-model.md](data-model.md).

Single change: Add `type String @default("CONTENT") @map("type")` to `CourseMaterial`.
Migration adds column with default — zero-downtime, no backfill.

### API Contracts

See [contracts/api-contracts.md](contracts/api-contracts.md).

Changes:
- **GET /api/admin/course-material**: Response includes `type` per material
- **GET /api/admin/course-material/[id]**: Response includes `type`, `blobUrl`, `blobPathname`
- **POST /api/admin/course-material**: Two variants — JSON (CONTENT) and FormData (SLIDE_CONTROL)
- **PUT /api/admin/course-material/[id]**: Two variants — JSON (CONTENT) and FormData (SLIDE_CONTROL)
- **DELETE**: Unchanged

### Contract Test Additions

New test cases for existing `tests/contracts/course-material-api.spec.ts`:
1. `POST with FormData creates SLIDE_CONTROL material`
2. `POST with FormData rejects non-HTML files`
3. `POST with FormData rejects oversized files`
4. `GET single includes type field`
5. `GET list includes type field per material`
6. `PUT with FormData updates SLIDE_CONTROL material`
7. `PUT with JSON on SLIDE_CONTROL material rejects with type mismatch`

### Unit Test Additions

New test cases for `tests/unit/schemas/course-material.spec.ts`:
1. `courseMaterialCreateSchema with type field`
2. `file validation: accepts .html`
3. `file validation: rejects non-.html`
4. `file validation: rejects oversized files`
5. `courseMaterialResponseSchema includes type`

### Quickstart

See [quickstart.md](quickstart.md).

Manual verification steps for both CONTENT and SLIDE_CONTROL flows.

### Agent Context

Updated via `update-agent-context.sh copilot`.

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do — DO NOT execute during /plan._

**Task Generation Strategy**:
- Load `tasks-template.md` as base
- Generate tasks from Phase 1 artifacts (data model, contracts, quickstart)
- Each contract change → contract test task [P]
- Each schema change → unit test task [P]
- Data model → migration task
- Each UI component → component task [P] where independent
- Each API change → API implementation task
- Integration tests from quickstart scenarios

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Schema/DB → API → UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: ~25 tasks covering:
- Phase A: Foundation (Prisma migration, Zod schemas, GET response extension)
- Phase B: API (POST/PUT FormData handling, file validation)
- Phase C: UI (MaterialTypeSelector, SlideControlUploadForm, create page, list page badge)
- Phase D: Edit page (type branching, file replacement)
- Phase E: Quality (lint, typecheck, test, manual verification)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan.

## Complexity Tracking

No constitution violations. No complexity deviations needed.

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command — describe approach only)
- [x] Phase 3: Tasks generated (/tasks command — 25 tasks, 5 phases)
- [x] Phase 4: Implementation complete (T001–T020: schema, API, UI all done)
- [x] Phase 5: Validation passed (lint ✅, typecheck ✅, 37/37 contracts ✅, 52/52 unit ✅)

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none needed)

---

_Based on Constitution v1.10.0 — See `.specify/memory/constitution.md`_