# Tasks: Course Material Integration (026)

**Feature**: 026-course-material-integration
**Input**: Design documents from `/specs/026-course-material-integration/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All paths are relative to repository root

---

## Phase 3.1: Foundation

- [x] T001 Add `type` field to `CourseMaterial` model in `prisma/schema.prisma`
  - Add: `type String @default("CONTENT") @map("type")` after `title` field
  - See: `data-model.md` → Prisma Schema Addition

- [x] T002 Run Prisma migration `add_material_type`
  - Run: `npx prisma migrate dev --name add_material_type`
  - Run: `npx prisma generate`
  - SQL: `ALTER TABLE seminar_materials ADD COLUMN "type" TEXT NOT NULL DEFAULT 'CONTENT';`
  - Verify: `npx prisma studio` → open `seminar_materials` → confirm `type` column with default `CONTENT`

- [x] T003 [P] Extend Zod schemas in `lib/schemas/admin/course-material.ts`
  - Add `MATERIAL_TYPES` constant: `["CONTENT", "SLIDE_CONTROL"] as const`
  - Add `MaterialType` type alias
  - Add `MAX_FILE_SIZE` constant: `20_971_520` (20 MB)
  - Add `ALLOWED_FILE_EXTENSIONS` constant: `[".html"]`
  - Add `type` field to `courseMaterialCreateSchema` (optional, default `"CONTENT"`)
  - Add `type` field to `courseMaterialResponseSchema`
  - Add `slideControlFileSchema` for file validation (extension, MIME, size)
  - See: `data-model.md` → Validation Rules

- [x] T004 [P] Extend Prisma CRUD helpers in `lib/api/course-material.ts`
  - Add `type` to `select` in `getAllMaterials()` return fields
  - Add `type` to `select` in `getMaterialById()` return fields
  - Add `type` param to `createMaterial()` data object
  - Add `blobUrl` and `blobPathname` to `getMaterialById()` select (for edit page)
  - See: `contracts/api-contracts.md` → GET responses

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE Phase 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY API implementation.**

- [x] T005 [P] Unit tests — type field + file validation in `tests/unit/schemas/course-material.spec.ts`
  - Test: `courseMaterialCreateSchema` accepts valid `type` ("CONTENT", "SLIDE_CONTROL")
  - Test: `courseMaterialCreateSchema` defaults to "CONTENT" when type omitted
  - Test: `courseMaterialCreateSchema` rejects invalid type value
  - Test: `slideControlFileSchema` accepts `.html` file within size limit
  - Test: `slideControlFileSchema` rejects `.txt`, `.pdf`, `.js` files
  - Test: `slideControlFileSchema` rejects files > 20 MB
  - Test: `courseMaterialResponseSchema` includes `type` field
  - See: `plan.md` → Unit Test Additions

- [x] T006 [P] Contract tests — GET endpoints return type field in `tests/contracts/course-material-api.spec.ts`
  - Test: `GET /api/admin/course-material` response includes `type` per material
  - Test: `GET /api/admin/course-material/[id]` response includes `type`, `blobUrl`, `blobPathname`
  - Mock: Prisma `findMany` / `findUnique` return type field
  - See: `contracts/api-contracts.md` → GET responses

- [x] T007 Contract tests — POST FormData creates SLIDE_CONTROL in `tests/contracts/course-material-api.spec.ts`
  - Test: `POST` with `multipart/form-data` containing title + `.html` file → 201 with `type: "SLIDE_CONTROL"`
  - Test: `POST` with FormData containing `.txt` file → 400 `"Nur .html-Dateien sind erlaubt"`
  - Test: `POST` with FormData containing file > 20 MB → 400 size error
  - Test: `POST` SLIDE_CONTROL stores file content as-is (no HTML sanitization applied) — verifies SU5
  - Mock: `@vercel/blob` `put()` for file upload
  - See: `contracts/api-contracts.md` → POST Variant B

- [x] T008 Contract tests — POST FormData identifier handling in `tests/contracts/course-material-api.spec.ts`
  - Test: `POST` with FormData but no identifier → auto-generates slug from title
  - Test: `POST` with FormData + taken identifier → 409 conflict

- [x] T009 Contract tests — PUT FormData + type mismatch in `tests/contracts/course-material-api.spec.ts`
  - Test: `PUT` with `multipart/form-data` on SLIDE_CONTROL material → 200, blob replaced
  - Test: `PUT` with FormData but no file (metadata-only update) → 200, blob unchanged
  - Test: `PUT` with `application/json` + `htmlContent` on SLIDE_CONTROL material → 400 type mismatch
  - Test: `PUT` with `multipart/form-data` on CONTENT material → 400 type mismatch
  - See: `contracts/api-contracts.md` → PUT + Type Mismatch

- [x] T010 Verify all new tests FAIL (TDD red phase)
  - Run: `npm run test -- --testPathPattern="course-material"`
  - Expected: All T005–T009 tests fail (implementation not yet done)
  - Purpose: Confirms TDD red phase — tests are testing real behavior

---

## Phase 3.3: API Implementation (make tests pass)

- [x] T011 [P] GET list — add type to response in `app/api/admin/course-material/route.ts`
  - Modify GET handler: include `type` in serialized response per material
  - See: `contracts/api-contracts.md` → GET /api/admin/course-material

- [x] T012 [P] GET single — add type + blob fields in `app/api/admin/course-material/[id]/route.ts`
  - Modify GET handler: include `type`, `blobUrl`, `blobPathname` in response
  - See: `contracts/api-contracts.md` → GET /api/admin/course-material/[id]

- [x] T013 POST — add FormData detection + SLIDE_CONTROL handling in `app/api/admin/course-material/route.ts`
  - Detect Content-Type: `request.headers.get('content-type')?.includes('multipart/form-data')`
  - If FormData: parse with `request.formData()`, extract `title`, `identifier`, `file`
  - Validate file: extension `.html`, MIME `text/html`, size ≤ 20 MB
  - Generate identifier from title if not provided (reuse `generateSlug()`)
  - Check identifier uniqueness (reuse `isIdentifierTaken()`)
  - Upload to Blob: pathname `course-material/slides/{identifier}.html`
  - Create DB record with `type: "SLIDE_CONTROL"`
  - Return 201 with full material object
  - If JSON: existing flow, ensure `type: "CONTENT"` is passed to create
  - Error handling: Rollbar for all server errors, structured error responses
  - See: `contracts/api-contracts.md` → POST Variant B, `data-model.md` → Blob Storage Pathnames

- [x] T014 PUT — add FormData variant + type mismatch guard in `app/api/admin/course-material/[id]/route.ts`
  - Fetch existing material to get `type`
  - Type mismatch guard:
    - If FormData request + material type `CONTENT` → 400 `"Materialtyp stimmt nicht mit der Anfrage überein"`
    - If JSON request with `htmlContent` + material type `SLIDE_CONTROL` → 400 same message
  - If FormData + SLIDE_CONTROL:
    - Parse FormData: `title?`, `identifier?`, `file?`
    - If `file` present: validate, delete old blob, upload new blob
    - If no `file`: metadata-only update (title/identifier)
  - If JSON + CONTENT: existing flow unchanged
  - See: `contracts/api-contracts.md` → PUT + Type Mismatch

- [x] T015 Verify contract + unit tests pass (TDD green phase)
  - Run: `npm run test -- --testPathPattern="course-material"`
  - Expected: All T005–T009 tests now PASS
  - Fix any remaining failures

---

## Phase 3.4: UI Components

- [x] T016 [P] Create `components/admin/MaterialTypeSelector.tsx`
  - Two clickable cards in a responsive grid (side-by-side desktop, stacked mobile)
  - Card A: `EditNoteOutlined` icon + „Ich möchte eine Inhaltsseite anlegen." → returns `"CONTENT"`
  - Card B: `UploadFileOutlined` icon + „Ich möchte eine Steuerdatei hinzufügen." → returns `"SLIDE_CONTROL"`
  - Props: `onSelect: (type: MaterialType) => void`
  - Keyboard accessible: focusable cards, Enter/Space triggers selection
  - Hover + focus states using design tokens (`colors.beige`, `colors.bronzeLight`)
  - WCAG 2.1 AA: aria-labels, focus-visible outlines
  - See: `research.md` → #4 List Page Type Badge, `spec.md` → MT1-MT4

- [x] T017 [P] Create `components/admin/SlideControlUploadForm.tsx`
  - Props: `onSubmit`, `onCancel`, optional `initialData` for edit mode
  - Title field: required, max 200 chars (MUI `TextField`)
  - Identifier field: optional, auto-generated from title (MUI `TextField`)
  - Drag-and-drop upload zone:
    - Pattern from `components/participation/ResumeUploader.tsx`
    - `onDragOver`/`onDragLeave`/`onDrop`/`onClick` handlers
    - Hidden `<input type="file" accept=".html">`
    - Background: `colors.beige` default, `colors.bronzeLight` on drag-over
    - `CircularProgress` with `aria-label="Datei wird hochgeladen"` during upload
    - `LinearProgress` for upload progress
  - File display: name + size after selection, remove button
  - Edit mode (`initialData` provided):
    - Show current file name (from `blobPathname`) + download link (to `blobUrl`)
    - „Datei ersetzen" button to upload replacement
  - Submit: builds `FormData`, sends to POST or PUT API endpoint
  - Cancel: navigates back
  - Error display: inline validation + server error messages
  - See: `research.md` → #6 Existing Code Patterns, `spec.md` → SU1-SU6

- [x] T018 [P] Add type badge chip to `components/admin/CourseMaterialTable.tsx`
  - Extend `CourseMaterial` interface: add `type: string` field
  - Display MUI `Chip` next to title column:
    - `type === "CONTENT"` → `<Chip label="Inhaltsseite" size="small" />` (default color)
    - `type === "SLIDE_CONTROL"` → `<Chip label="Steuerdatei" size="small" color="secondary" />`
  - See: `research.md` → #4 List Page Type Badge, `spec.md` → LP1-LP2

- [x] T019 Convert create page to server→client dynamic-import pattern (AR3)
  - Convert `app/admin/course-material/new/page.tsx` to a **server component** (remove `'use client'`)
  - Create `app/admin/course-material/new/create-client.tsx` as a **client component** (`'use client'`)
  - In `page.tsx`: load via `dynamic(() => import('./create-client'), { ssr: false })`
    with `CircularProgress` loading indicator (same pattern as `edit/page.tsx` → `edit-client.tsx`)
  - In `create-client.tsx`:
    - Add state: `selectedType: MaterialType | null` (initially `null`)
    - When `null`: render `MaterialTypeSelector` component
    - When `"CONTENT"`: render existing `MaterialForm` (unchanged)
    - When `"SLIDE_CONTROL"`: render `SlideControlUploadForm`
    - Add back-to-selection button (reset `selectedType` to `null`)
    - Ensure submit handlers pass correct `type` to respective API calls
  - Depends on: T016 (MaterialTypeSelector), T017 (SlideControlUploadForm)

- [x] T020 Modify edit page `app/admin/course-material/[id]/edit/edit-client.tsx`
  - Fetch `type` from GET metadata response (added in T012)
  - If `type === "CONTENT"`: render existing `MaterialForm` (no change)
  - If `type === "SLIDE_CONTROL"`: render `SlideControlUploadForm` in edit mode
    - Pass `initialData`: `{ title, identifier, blobPathname, blobUrl }`
    - Submit handler sends `FormData` to PUT API
  - Show type label (non-editable) in page header: „Typ: Inhaltsseite" or „Typ: Steuerdatei"
  - Type is immutable — no option to change (per EP4 requirement)
  - Depends on: T017 (SlideControlUploadForm in edit mode)
  - See: `spec.md` → EP1-EP4

---

## Phase 3.5: Polish & Validation

- [x] T021 [P] Run lint — `npm run lint` — fix any new Biome issues
- [x] T022 [P] Run typecheck — `npm run typecheck` — fix any TypeScript errors
- [x] T023 Run full test suite — `npm run test` — all tests pass
- [x] T024 Manual verification per `quickstart.md`:
  - Step 3: Create CONTENT material via type selection → verify SlideEditor + list badge „Inhaltsseite"
  - Step 4: Create SLIDE_CONTROL material via upload → verify blob storage + list badge „Steuerdatei"
  - Step 5: Edit both types → verify correct UI renders per type
  - Step 6: Constraint checks → reject `.txt`, reject oversized file, immutable type
  - Step 7: `npm run lint && npm run typecheck && npm run test` all green
- [x] T025 Update `plan.md` progress tracking — mark Phase 3 + 4 complete

---

## Dependencies

```
T001 → T002 → T003 [P] + T004 [P]

T003, T004      → T005 [P] (unit tests, different file)
T003, T004      → T006 [P] (contract tests, different file)
T006 → T007 → T008 → T009 (same file: course-material-api.spec.ts)
T005–T009       → T010 (verify red phase)

T010            → T011 [P] + T012 [P] (different API route files)
T011            → T013 (same file: route.ts)
T012            → T014 (same file: [id]/route.ts)
T013, T014      → T015 (verify green phase)

T015            → T016 [P] + T017 [P] + T018 [P] (three different new/existing files)
T016, T017      → T019 (create page uses both components)
T017            → T020 (edit page uses SlideControlUploadForm)
T018            — no dependencies on T016/T017

T019, T020      → T021 [P] + T022 [P]
T021, T022      → T023 → T024 → T025
```

## Parallel Execution Examples

### Batch 1: Foundation (after migration)
```
Task: "T003 [P] Extend Zod schemas in lib/schemas/admin/course-material.ts"
Task: "T004 [P] Extend Prisma CRUD helpers in lib/api/course-material.ts"
```

### Batch 2: Tests First (TDD)
```
Task: "T005 [P] Unit tests — type field + file validation in tests/unit/schemas/course-material.spec.ts"
Task: "T006 [P] Contract tests — GET endpoints return type in tests/contracts/course-material-api.spec.ts"
```
_Then sequential: T007 → T008 → T009 (same file as T006)_

### Batch 3: API Implementation
```
Task: "T011 [P] GET list — add type to response in app/api/admin/course-material/route.ts"
Task: "T012 [P] GET single — add type + blob fields in app/api/admin/course-material/[id]/route.ts"
```
_Then sequential per file: T013 after T011, T014 after T012_

### Batch 4: UI Components
```
Task: "T016 [P] Create components/admin/MaterialTypeSelector.tsx"
Task: "T017 [P] Create components/admin/SlideControlUploadForm.tsx"
Task: "T018 [P] Add type badge chip to components/admin/CourseMaterialTable.tsx"
```
_Then: T019 (create page), T020 (edit page)_

### Batch 5: Quality Gates
```
Task: "T021 [P] Run lint"
Task: "T022 [P] Run typecheck"
```
_Then: T023 (test suite) → T024 (manual) → T025 (docs)_

---

## Validation Checklist

- [x] All API contracts have corresponding tests (T006–T009)
- [x] All entities have model tasks (T001–T002)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Unit test tasks cover all schema additions (T005)
- [x] Contract test tasks cover all 12 planned test cases (T006–T009)
- [x] UI tasks cover all quickstart verification scenarios (T016–T020)
- [x] Manual verification references quickstart.md (T024)

---

## Summary

| Phase | Tasks | Parallel? | Scope |
|-------|-------|-----------|-------|
| 3.1: Foundation | T001–T004 | T003 ∥ T004 | Migration, schemas, CRUD |
| 3.2: Tests First | T005–T010 | T005 ∥ T006, then sequential | 12 contract + 18 unit tests |
| 3.3: API Implementation | T011–T015 | T011 ∥ T012, then sequential | GET/POST/PUT extensions |
| 3.4: UI Components | T016–T020 | T016 ∥ T017 ∥ T018, then sequential | Selector, upload form, badge, pages |
| 3.5: Polish | T021–T025 | T021 ∥ T022, then sequential | Lint, typecheck, test, manual, docs |

**Total Tasks**: 25
**TDD Coverage**: 30 test cases (12 contract + 18 unit) written before implementation