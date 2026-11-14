# Tasks: Extended Material Upload (Feature 030)

**Feature**: 030-extended-material-upload  
**Branch**: `030-extended-material-upload`  
**Date**: 2026-07-07  
**Spec**: [Feature 030 Specification](./spec.md)

**Implementation Strategy**: TDD order (tests first) → Parallel component development → E2E validation

---

## Task Dependency Graph

```
Setup (fixtures)
    ↓
[P] Contract Tests → API Handler Implementation
[P] Integration Test → API Handler Implementation
[P] E2E Test Setup
    ↓
UI Components (MaterialTypeSelection, HTMLContentUploadForm)
    ↓
Route Integration (extend new/page.tsx)
    ↓
List Page Update (type badges)
    ↓
[P] Full Test Suite Validation
    ↓
Polish & Documentation
```

---

## Tasks

### T001: Create Test Fixture File

**Type**: Setup  
**Priority**: P0 (blocking)  
**File**: `tests/fixtures/advanced-css.html`

**Description**:
Create test HTML file for upload scenarios. This fixture will be reused across contract, integration, and E2E tests.

**Acceptance Criteria**:

- [x] File exists at `tests/fixtures/advanced-css.html`
- [x] File is valid HTML (doctype, head, body structure)
- [x] File size is 5 MB (typical course material size)
- [x] Content includes meaningful course material (headings, sections, lists)
- [x] File can be read and served without errors

**Implementation Notes**:
Use the template from quickstart.md. Ensure file is valid HTML5 with UTF-8 encoding.

---

### T002: Write Contract Test for POST /api/admin/course-material [P]

**Type**: Test (Contract)  
**Priority**: P0  
**File**: `tests/contracts/upload-html-content-material.spec.ts`

**Description**:
Contract test for the POST /api/admin/course-material endpoint. Tests API specification compliance without implementation.

**Acceptance Criteria**:

- [x] Test file created with correct structure (Vitest)
- [x] Test imports contract spec from `../../specs/030-extended-material-upload/contracts/upload-html-content-material.md`
- [x] Test case: "Should accept FormData with title, identifier, file"
- [x] Test case: "Should reject non-.html files (400 error)"
- [x] Test case: "Should reject files > 20 MB (400 error)"
- [x] Test case: "Should require title field (400 error)"
- [x] Test case: "Should return 201 with material metadata on success"
- [x] Test case: "Should return 401 for unauthenticated requests"
- [x] Test case: "Should return 403 for non-admin users"
- [x] Mock Clerk auth for test scenarios
- [x] Mock Vercel Blob storage responses
- [x] All tests fail initially (no implementation)

**Implementation Notes**:
Reference Feature 026 contract tests for auth/blob mocking patterns. Use mock-http or similar for API testing. Tests must fail until T003 is complete.

---

### T003: Write Integration Test for Upload Flow [P]

**Type**: Test (Integration)  
**Priority**: P0  
**File**: `tests/integration/course-material-upload.spec.ts`

**Description**:
Integration test for full upload flow: file → validation → Blob storage → DB insert → response.

**Acceptance Criteria**:

- [x] Test file created with correct structure (Vitest)
- [x] Setup: Admin user authenticated, test course created in DB
- [x] Test case: "Should upload HTML file and create CourseMaterial record"
  - [x] File uploaded to Blob storage
  - [x] Material stored in DB with type: CONTENT
  - [x] blobPathname matches pattern `course-material/content/{identifier}.html`
  - [x] blobUrl is public read-only
- [x] Test case: "Should auto-generate identifier if not provided"
- [x] Test case: "Should reject invalid HTML gracefully" (optional validation)
- [x] Test case: "Error handling: generic client message, detailed server log"
- [x] Test case: "Concurrent uploads don't cause ID collisions"
- [x] All tests fail initially (no implementation)

**Implementation Notes**:
Reuse DB test setup from hemera (Prisma Testcontainers or test database). Mock Blob storage or use test blob bucket. Reference Feature 026 integration tests for patterns.

---

### T004: Write E2E Test for UI Layout [P]

**Type**: Test (E2E)  
**Priority**: P1  
**File**: `tests/e2e/course-material-upload.spec.ts`

**Description**:
E2E test for material type selection screen and upload flow via browser.

**Acceptance Criteria**:

- [x] Test file created with correct structure (Playwright)
- [x] Setup: Run dev server, login as admin, navigate to `/admin/course-material/new`
- [x] Test case: "Material type selection screen renders 3 tiles in 2-1 layout"
  - [x] Tile 1: "Ich möchte eine Inhaltsseite hinzufügen." (top-left)
  - [x] Tile 2: "Ich möchte eine Inhaltsseite anlegen." (top-right)
  - [x] Tile 3: "Ich möchte eine Steuerdatei hinzufügen." (bottom)
- [x] Test case: "Clicking 'hinzufügen' tile opens upload form"
  - [x] Route to `/admin/course-material/new?type=upload`
  - [x] Form displays title, identifier, file upload zone
- [x] Test case: "Upload HTML file and verify success"
  - [x] Select file via drag-and-drop
  - [x] Click "Speichern"
  - [x] Upload completes < 5 seconds
  - [x] Success notification appears
  - [x] Redirect to material list
- [x] Test case: "Material appears in list with type badge 'Inhaltsseite'"
- [x] Test case: "Clicking 'anlegen' tile opens SlideEditor (regression)"
- [x] All tests fail initially (no UI implementation)

**Implementation Notes**:
Use Playwright best practices. Reference Feature 026 E2E tests. Use test fixtures created in T001.

---

### T005: Extend POST Handler in app/api/admin/course-material/route.ts

**Type**: Implementation (API)  
**Priority**: P0  
**File**: `app/api/admin/course-material/route.ts`

**Description**:
Extend POST /api/admin/course-material handler to support HTML file upload (from T002 & T003 contract/integration tests). The handler lives in the App Router route file alongside auth and request-ID handling, consistent with the rest of the stack.

**Acceptance Criteria**:

- [x] Handler accepts FormData with title, identifier, file
- [x] Server-side validation:
  - [x] File extension: .html only
  - [x] Content-Type: text/html
  - [x] File size: ≤ 20 MB
- [x] Blob storage:
  - [x] Upload file to Vercel Blob at `course-material/content/{identifier}.html`
  - [x] Set access: 'public'
  - [x] Return blobUrl and blobPathname
- [x] Database:
  - [x] Create CourseMaterial record with:
    - [x] title (required, 1-255 chars)
    - [x] identifier (auto-generated if omitted)
    - [x] type: 'CONTENT'
    - [x] blobPathname
    - [x] blobUrl
    - [x] htmlContent: null
- [x] Error handling:
  - [x] Validation errors: 400 Bad Request (generic message to client, detailed log)
  - [x] Auth errors: 401/403 (reuse from Feature 026)
  - [x] Blob errors: 500 (generic to client, full error logged)
  - [x] DB errors: 500 (generic to client, full error logged)
  - [x] All server-side errors logged via `serverInstance.error()` from `@/lib/monitoring/rollbar-official`
  - [x] No `console.error` statements in new code (constitution v1.8.0)
- [x] Idempotency:
  - [x] Reject duplicate identifier with 409 Conflict (idempotency protection)
- [x] Response: 201 Created with material metadata
- [x] Contract tests (T002) now pass
- [x] Integration tests (T003) now pass

**Implementation Notes**:
Reference Feature 026 PUT handler. Reuse blob-storage.ts helper. No sanitization of HTML. Error messages in informal German.

---

### T006: Create MaterialTypeSelection Component [P]

**Type**: Implementation (UI)  
**Priority**: P1  
**File**: `app/admin/course-material/new/create-client.tsx`

**Description**:
Create new client component for material type selection (tile selection UI).

**Acceptance Criteria**:

- [x] Component file created at `app/admin/course-material/new/create-client.tsx`
- [x] Renders 3 tiles in CSS Grid 2-1 layout:
  - [x] Tile 1: "Ich möchte eine Inhaltsseite hinzufügen." (routes to upload form)
  - [x] Tile 2: "Ich möchte eine Inhaltsseite anlegen." (routes to SlideEditor)
  - [x] Tile 3: "Ich möchte eine Steuerdatei hinzufügen." (routes to control file upload)
- [x] Tiles styled with MUI `Card` + `Button` (reuse from Feature 026)
- [x] Icons reuse existing upload icon from "Steuerdatei hinzufügen" tile
- [x] Layout responsive (mobile: stack vertically)
- [x] Tiles keyboard-navigable (Tab, Enter)
- [x] Focus management: visible focus indicators on all tiles
- [x] ARIA roles: tiles announced as buttons to screen readers
- [x] Click tile: Route to appropriate upload/edit form (via Next.js router)
- [x] E2E tests (T004) for tile layout pass

**Implementation Notes**:
This is a simple wrapper component. Reuse design tokens and MUI styling from Feature 026. No new CSS needed. Mark component as `'use client'`.

---

### T007: Create HTMLContentUploadForm Component [P]

**Type**: Implementation (UI)  
**Priority**: P1  
**File**: `app/admin/course-material/new/html-upload-form.tsx`

**Description**:
Create form component for HTML file upload (reuses pattern from Feature 026 slide control upload).

**Acceptance Criteria**:

- [x] Component file created at `app/admin/course-material/new/html-upload-form.tsx`
- [x] Form fields:
  - [x] Title (required, text input, 1-255 chars)
  - [x] Identifier (optional, text input, auto-generated if empty)
- [x] File upload zone:
  - [x] Drag-and-drop zone with visual feedback
  - [x] "Datei auswählen" button (click to browse files)
  - [x] Display file name + size after selection
  - [x] Preview: "5.0 MB" format
- [x] Form buttons:
  - [x] "Speichern" (submit)
  - [x] "Abbrechen" (cancel/back)
- [x] Validation (client-side):
  - [x] Title required before submit
  - [x] File required before submit
  - [x] File extension check: .html only
  - [x] Show validation errors inline
- [x] Upload handling:
  - [x] Show progress indicator during upload
  - [x] POST to `/api/admin/course-material` with FormData
  - [x] Success: show toast, redirect to material list
  - [x] Error: show toast with generic error message
  - [x] Server errors logged via Rollbar (`serverInstance.error()`); no `console.error`
- [x] Accessibility:
  - [x] Drag-and-drop zone labeled (aria-label)
  - [x] File input keyboard-accessible
  - [x] Form labels properly associated

**Implementation Notes**:
Reuse upload zone component from Feature 026. Reuse FormData handling pattern. Error handling: generic message to user, errors logged server-side. Mark component as `'use client'`.

---

### T008: Extend app/admin/course-material/new/page.tsx

**Type**: Implementation (UI)  
**Priority**: P1  
**File**: `app/admin/course-material/new/page.tsx`

**Description**:
Extend existing page.tsx to integrate MaterialTypeSelection component and route based on query param.

**Acceptance Criteria**:

- [x] Page.tsx remains server component
- [x] Dynamic import MaterialTypeSelection with `ssr: false`
- [x] Check searchParams.type:
  - [x] No type / type=select: Show MaterialTypeSelection
  - [x] type=upload: Show HTMLContentUploadForm
  - [x] type=editor: Show existing SlideEditor (no changes)
  - [x] type=control: Show existing slide control upload (from Feature 026)
- [x] Loading state shown during dynamic import
- [x] Focus management: keyboard focus moves to new content when route changes
- [x] Existing routes still work (backward compatibility)
- [x] E2E tests (T004) for routing pass

**Implementation Notes**:
Minimal changes to existing page.tsx. Reuse existing layout and styling. Reference Feature 026 for existing routes. Next.js App Router `searchParams` prop available in server component.

---

### T009: Update Material List Page with Type Badges [P]

**Type**: Implementation (UI)  
**Priority**: P2  
**File**: `app/admin/course-material/page.tsx`

**Description**:
Extend existing material list page to display type badge (MUI Chip) for each material.

**Acceptance Criteria**:

- [x] Material list renders existing materials + new uploaded materials
- [x] For each material, display type badge:
  - [x] "Inhaltsseite" for type: CONTENT
  - [x] "Steuerdatei" for type: SLIDE_CONTROL
- [x] Badge styled with MUI `Chip` component
- [x] Badge color matches design tokens (use existing colors from Feature 026)
- [x] Badge appears next to material title
- [x] Existing list functionality unchanged
- [x] E2E test (T004) for type badge display passes

**Implementation Notes**:
Type badges already implemented in Feature 026 (`CourseMaterialTable.tsx`). No changes needed — both CONTENT (uploaded and editor-created) and SLIDE_CONTROL materials display correct badges.

---

### T010: Validate All Tests Pass (Contract + Integration + E2E) [P]

**Type**: Validation  
**Priority**: P0  
**File**: N/A (run test suites)

**Description**:
Run complete test suite to ensure all contract, integration, and E2E tests pass.

**Acceptance Criteria**:

- [x] Contract tests (T002) all pass: `npm run test -- tests/contracts/upload-html-content-material.spec.ts`
- [x] Integration tests (T003) all pass: `npm run test -- tests/integration/course-material-upload.spec.ts`
- [x] E2E tests (T004) all pass: `npm run test:e2e -- tests/e2e/course-material-upload.spec.ts`
- [x] No console errors or warnings in test output
- [x] Code coverage meets minimum threshold (if configured)

**Implementation Notes**:
Run after all implementation tasks (T005-T009) are complete. Fix any failing tests before proceeding.

---

### T011: Run Quickstart Scenario (Manual QA)

**Type**: Validation  
**Priority**: P1  
**File**: N/A (manual test)

**Description**:
Execute quickstart.md scenario manually to validate happy-path user experience.

**Acceptance Criteria**:

- [ ] Start dev server: `npm run dev`
- [ ] Login as admin (Clerk test credentials)
- [ ] Navigate to `/admin/course-material/new`
- [ ] Verify 3 tiles render in 2-1 layout
- [ ] Click "hinzufügen" tile
- [ ] Upload `tests/fixtures/advanced-css.html`
- [ ] Upload completes < 5 seconds
- [ ] Material appears in list with type badge "Inhaltsseite"
- [ ] Click material to verify it displays correctly
- [ ] Click "anlegen" tile: verify SlideEditor opens (regression test)

**Implementation Notes**:
Follow exact steps from quickstart.md. Document any deviations or bugs. Verify UI feels polished and responsive.

---

### T012: Lint, Type Check, and Build Validation

**Type**: Validation  
**Priority**: P1  
**File**: N/A (run checks)

**Description**:
Run repository quality gates to ensure no new lint/type errors.

**Acceptance Criteria**:

- [x] `npm run lint` passes (Biome check)
- [x] `npm run typecheck` passes (TypeScript strict mode)
- [x] `npm run build` succeeds without errors
- [x] No new type errors in modified files
- [x] No import order violations
- [x] No unused imports or variables

**Implementation Notes**:
Run after all implementation tasks. Fix any violations before PR.

---

### T013: Update copilot-instructions.md with Recent Changes

**Type**: Documentation  
**Priority**: P2  
**File**: `.github/copilot-instructions.md`

**Description**:
Update copilot-instructions.md to document Feature 030 changes for future development context.

**Acceptance Criteria**:

- [x] Add Feature 030 to "Recent Changes" section (keep last 3 features)
- [x] Document: "030-extended-material-upload: Added new tile for uploading HTML content files to course material interface (Material type selection, HTML upload form, API endpoint)"
- [x] Preserve existing recent changes from Features 029, 028, 026
- [x] Keep section under 150 lines for token efficiency

**Implementation Notes**:
Reference the existing copilot-instructions.md format. Run update-agent-context.sh if available, or manually edit.

---

## Parallel Execution Groups

### Group 1: Tests (can run in parallel)

- **T002**: Contract test
- **T003**: Integration test
- **T004**: E2E test

### Group 2: UI Components (can run in parallel after T005)

- **T006**: MaterialTypeSelection component
- **T007**: HTMLContentUploadForm component
- **T009**: Update material list

### Execution Example:

```bash
# Sequential setup
npm run test -- tests/fixtures/  # T001 fixture exists
npm run test -- tests/contracts/upload-content-material.spec.ts  # T002 (should fail)
npm run test -- tests/integration/course-material-upload.spec.ts  # T003 (should fail)
npm run test:e2e -- tests/e2e/course-material-upload.spec.ts  # T004 (should fail)

# Implement API (T005)
# Tests now pass

# Implement UI in parallel (T006, T007, T009)

# Validate all together (T010, T011, T012)
npm run test
npm run test:e2e
npm run lint
npm run typecheck
npm run build
```

---

## Summary

**Total Tasks**: 13  
**Setup**: 1 (T001)  
**Tests**: 3 (T002-T004) [P]  
**Implementation**: 5 (T005-T009)  
**Validation**: 3 (T010-T012) [P]  
**Documentation**: 1 (T013)

**Estimated Effort**:

- Setup: 15 min
- Tests: 90 min (write 3 test files)
- API Implementation: 60 min (extend handler)
- UI Implementation: 120 min (3 components + page extension)
- Validation: 45 min (test runs + manual QA)
- Documentation: 15 min
- **Total: ~5-6 hours**

**Success Criteria**: All tasks complete, tests pass, quickstart scenario works, builds successfully.

---

_Based on Feature 030 Plan_ | _See specs/030-extended-material-upload/ for detailed design_
