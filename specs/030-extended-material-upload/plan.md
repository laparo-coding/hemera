# Implementation Plan: Extended Material Upload (Feature 030)

**Branch**: `030-extended-material-upload` | **Date**: 2026-07-07 | **Spec**: [Feature 030](./spec.md)

**Input**: Feature specification from `/specs/030-extended-material-upload/spec.md`

## Execution Flow (/plan command scope)

```
1. ✅ Load feature spec from Input path
2. ✅ Fill Technical Context
3. ✅ Fill Constitution Check
4. ✅ Initial Constitution Check evaluation
5. → Execute Phase 0: research.md
6. → Execute Phase 1: contracts, data-model.md, quickstart.md
7. → Re-evaluate Constitution Check
8. → Plan Phase 2 task generation approach
9. ✅ STOP - Ready for /tasks command
```

## Summary

Feature 030 extends the course material upload interface by adding a new tile for uploading complete HTML content files ("Ich möchte eine Inhaltsseite hinzufügen") alongside the existing editor tile ("Ich möchte eine Inhaltsseite anlegen"). The feature reuses the upload pattern from Feature 026 (slide control files) and reorganizes the tile layout for improved UX. No changes to existing editors or file validation—only UI reorganization and new upload entry point.

## Technical Context

**Language/Version**: TypeScript 6.0 | Next.js 16.2 (App Router) | React 19  
**Primary Dependencies**: Prisma ORM 7.5.0, Material-UI v7, Vercel Blob storage  
**Storage**: PostgreSQL (existing `CourseMaterial` model from Feature 026)  
**Testing**: Vitest (unit/contract), Playwright (E2E)  
**Target Platform**: Web (Next.js App Router)  
**Project Type**: Web (frontend + backend via API routes)  
**Performance Goals**: File upload < 5s for 20 MB files; API response < 100ms  
**Constraints**: Max 20 MB HTML files; .html extension only; no sanitization (stored as-is)  
**Scale/Scope**: Single new tile + API endpoint; extends existing CourseMaterial feature

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Constitutional Requirement | Status | Notes |
|----------------------------|--------|-------|
| **Course Data Authority** (v1.11.0) | ✅ PASS | HTML content stored in Blob with DB metadata; no placeholder data |
| **Code Organization** (db-only sourcing) | ✅ PASS | Reuses existing Prisma model; no hardcoded materials |
| **UI Consistency** (informal German) | ✅ PASS | Labels "hinzufügen"/"anlegen" already confirmed; consistent with Feature 026 |
| **Design Tokens** (from Feature 026) | ✅ PASS | Icon/styling reused from existing "Steuerdatei hinzufügen" tile |
| **API Security** (upload validation) | ✅ PASS | File extension + Content-Type validation required; matches Feature 026 pattern |
| **Deployment & Testing** (E2E coverage) | ⚠️ CONDITIONAL | Playwright E2E tests must cover new upload flow; TBD in Phase 2 |

## Project Structure

### Documentation (this feature)

```
specs/030-extended-material-upload/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/plan output)
├── research.md          # Phase 0 output (research findings)
├── data-model.md        # Phase 1 output (entity updates)
├── quickstart.md        # Phase 1 output (integration test scenario)
├── contracts/           # Phase 1 output
│   └── upload-html-content-material.md  # API contract for new endpoint
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
app/
├── admin/
│   └── course-material/
│       ├── new/
│       │   ├── page.tsx           # Type selection screen (extend existing)
│       │   └── create-client.tsx   # Type selection + route logic
│       └── [id]/edit/
│           └── edit-client.tsx     # Material editor (extend existing)

lib/
├── api/
│   └── course-materials.ts         # Extend with HTML content upload handler
└── services/
    └── blob-storage.ts             # Reuse existing Blob pattern

prisma/
└── schema.prisma                   # No changes needed (type already from Feature 026)

tests/
├── contracts/
│   └── upload-html-content-material.spec.ts  # API contract test
├── integration/
│   └── course-material-upload.spec.ts   # Integration test (new upload flow)
└── e2e/
    └── course-material-upload.spec.ts   # Playwright E2E test
```

**Structure Decision**: Extend existing Feature 026 components and API handlers. No new files for business logic; all changes are UI reorganization, API endpoint extension, and contract/test additions.

## Phase 0: Outline & Research

_All clarifications resolved in Spec Phase; no NEEDS CLARIFICATION remain._

### Research Findings

| Topic | Finding | Source |
|-------|---------|--------|
| **HTML Upload Pattern** | Reuse existing Feature 026 slide control file upload; max 20 MB, .html validation server-side | Spec req UP1-UP6 |
| **Storage Pattern** | Vercel Blob under `course-material/content/{identifier}.html`; no sanitization | Spec req UP3 |
| **Type Differentiation** | Use existing `CourseMaterialType` enum (CONTENT, SLIDE_CONTROL); both stored identically in DB | Spec clarification #3 |
| **UI Layout** | CSS Grid 2-column first row, 1-column second row; reuse "Steuerdatei" icon | Spec req LY1-LY2 |
| **Tile Labeling** | "hinzufügen" (upload) vs "anlegen" (editor); consistent across interface | Spec clarification #3 |
| **Error Handling** | Generic client messages; detailed server-side logging (pattern from Feature 026) | Spec req UP6 |
| **Testing Strategy** | Contract tests for API; integration tests for upload flow; E2E tests for UI layout | AGENTS.md testing stack |

### Phase 0 Status

✅ **COMPLETE** — No unknowns; all clarifications documented in spec; ready for Phase 1 design.

---

## Phase 1: Design & Contracts

### 1.1 Data Model Analysis

**CourseMaterial Entity** (no schema changes needed; extends Feature 026):

- Field `type` already exists: `CourseMaterialType` enum (CONTENT, SLIDE_CONTROL)
- New HTML content upload → stored with `type: CONTENT` (same as editor-created content)
- Field `blobPathname` stores `course-material/content/{identifier}.html`
- Field `blobUrl` stores public read-only Vercel Blob URL

**No migration required** — type field already exists from Feature 026.

### 1.2 API Contract

**Endpoint**: `POST /api/admin/course-material` (extend existing)

| Aspect | Specification |
|--------|---------------|
| **Purpose** | Create new course material with HTML file upload |
| **Method** | POST |
| **Auth** | Clerk auth required; admin role required (per existing pattern) |
| **Input** | `FormData` with `title` (required), `identifier` (optional), `file` (.html, ≤20 MB) |
| **Validation** | File extension + `Content-Type: text/html` server-side |
| **Success** | 201 Created with material metadata (id, title, type, blobUrl, blobPathname) |
| **Error** | 400 (validation), 401 (auth), 403 (forbidden), 409 (duplicate identifier), 500 (DB failure), 502 (Blob storage failure) |

**Response Schema**:
```json
{
  "id": "uuid",
  "title": "string",
  "identifier": "string",
  "type": "CONTENT",
  "blobUrl": "https://...",
  "blobPathname": "course-material/content/{identifier}.html",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### 1.3 UI Components

**Component: MaterialTypeSelection** (new client component)

- Location: `app/admin/course-material/new/create-client.tsx`
- Behavior:
  - Render 3 tiles: "hinzufügen" (new), "anlegen" (existing), "Steuerdatei hinzufügen"
  - Layout: CSS Grid 2-column first row, 1-column second row
  - On click: Route to upload form or existing editor
- Reuses: Icon from Feature 026; MUI Chip styling

**Component: HTMLContentUploadForm** (new client component)

- Location: `app/admin/course-material/new/html-upload-form.tsx`
- Behavior:
  - Title field (required)
  - Identifier field (optional, auto-generated)
  - Drag-and-drop zone (file preview after upload)
  - Submit/Cancel buttons
  - Upload progress indicator
- Validation: Client-side file extension check; server-side Content-Type + size

### 1.4 Implementation References

**Reuse from Feature 026**:
- `app/api/admin/course-material/route.ts` — extend POST handler
- `app/admin/course-material/new/page.tsx` — extend type selection logic
- `lib/services/blob-storage.ts` — reuse upload helper
- `tests/contracts/upload-html-content-material.spec.ts` — extend contract tests

### 1.5 Testing Strategy

**Contract Tests** (Vitest):
- ✅ POST endpoint accepts FormData with title, identifier, file
- ✅ Rejects non-.html files (400 error)
- ✅ Rejects files > 20 MB (400 error)
- ✅ Returns 201 with material metadata on success
- ✅ Stores file in Blob with correct pathname

**Integration Tests** (Vitest):
- ✅ Upload flow: file → validation → Blob storage → DB insert
- ✅ Error handling: invalid file → generic error message returned to client; server logs via `serverInstance.error()` (Rollbar)
- ✅ Concurrent uploads don't cause ID collisions (auto-generated identifiers unique)

**E2E Tests** (Playwright):
- ✅ Material type selection screen renders 3 tiles in correct layout
- ✅ Clicking "hinzufügen" tile opens upload form
- ✅ Drag-and-drop HTML file triggers upload
- ✅ Upload success: list page shows new material with type badge "Inhaltsseite"
- ✅ Clicking "anlegen" tile opens SlideEditor (existing, no changes)

### 1.6 Quickstart: Integration Test Scenario

**Scenario**: Admin uploads complete HTML course material

**Setup**:
1. Navigate to `/admin/course-material/new`
2. Verify 3 tiles render in 2-1 layout

**Steps**:
1. Click "Ich möchte eine Inhaltsseite hinzufügen"
2. Enter title "Advanced CSS Patterns"
3. Upload file `advanced-css.html` (5 MB, valid HTML)
4. Click "Save"

**Expected Outcome**:
- Upload completes (< 5 seconds)
- Material appears in list with type badge "Inhaltsseite"
- File stored in Blob at `course-material/content/{identifier}.html`
- DB record has `type: CONTENT`

---

## Phase 2: Task Planning Approach

_This section describes task generation strategy; /tasks command will create tasks.md_

### Task Generation Strategy

**Source Materials**:
- Phase 1 API contract → contract test tasks
- Phase 1 data model → no schema tasks (type field exists)
- Phase 1 UI components → component implementation tasks
- Integration test scenario → integration test tasks

### Task Ordering (TDD + Dependency Order)

**Priority 1 (Tests First)**:
1. Contract tests for POST endpoint (✅ must fail initially)
2. Integration test for upload flow (✅ must fail)
3. E2E test for UI layout (✅ must fail)

**Priority 2 (Data/API)**:
4. Extend `POST /api/admin/course-material` handler
5. Extend `lib/api/course-materials.ts` with HTML upload logic
6. Extend blob storage helpers if needed

**Priority 3 (UI)**:
7. Create `MaterialTypeSelection` component
8. Create `HTMLContentUploadForm` component
9. Extend `app/admin/course-material/new/page.tsx` with type selection logic
10. Update material list to display type badges (extend from Feature 026)

**Priority 4 (Integration)**:
11. Validate all tests pass (contract + integration + E2E)
12. Manual QA: UI layout, upload experience, file storage

### Estimated Task Count

**Total**: 10-12 tasks (mix of [P] parallel and sequential)

### Parallel Execution Opportunities

- Contract test + E2E test (independent)
- Component implementation + handler extension (dependent on API spec, but can start in parallel after tests written)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

---

## Complexity Tracking

_No constitutional violations detected; no complexity deviations._

| Item | Status |
|------|--------|
| Violations | None |
| Deviations | None |

---

## Progress Tracking

_Updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning documented (/plan command - approach described)
- [x] Phase 3: Tasks generated (/tasks command) — **13 tasks in tasks.md**
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] No Complexity deviations

---

_Based on Constitution v2.1.1 - See `.specify/memory/constitution.md`_
