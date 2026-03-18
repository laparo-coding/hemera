# Research: Course Material Integration (026)

## Phase 0 — Unknowns Resolution

All Technical Context items resolved; no NEEDS CLARIFICATION remaining.

### 1. Material Type Discrimination

**Decision**: Add a `type` column (`String`, default `'CONTENT'`) to `CourseMaterial`.
**Rationale**: Both CONTENT and SLIDE_CONTROL materials are HTML files stored in Vercel Blob with
identical MIME types and extensions. File-extension heuristics cannot distinguish them; an explicit
DB field is the simplest, most reliable approach.
**Alternatives**:
- Blob pathname convention (e.g., `course-material/slides/` vs `course-material/`) — fragile, would
  require path parsing at every read.
- Separate Prisma model (`SlideControlFile`) — adds join complexity and diverges CRUD patterns that
  are otherwise identical.

### 2. Upload Pattern for HTML Files (FormData)

**Decision**: Extend the existing `POST /api/admin/course-material` route to accept `multipart/form-data`
in addition to `application/json`. Detect via `Content-Type` header.
**Rationale**: Reuses the existing endpoint, Zod schemas, and audit logging. The alternative
(separate route, e.g., `POST /api/admin/course-material/upload`) would duplicate auth, validation,
and identifier handling.
**Alternatives**:
- Separate upload endpoint — rejected for DRY reasons.
- Client-side Base64 encoding + JSON body — rejected for 20 MB files (33% overhead, memory pressure).

### 3. File Validation Strategy

**Decision**: Server-side validation: check file extension (`.html`, case-insensitive), MIME type
starts with `text/html` (to accept `text/html; charset=utf-8`), and file size ≤ 20 MB.
No sanitization for SLIDE_CONTROL files.
**Rationale**: Slide control files are admin-uploaded and rendered in controlled contexts. Sanitizing
them would break their functionality (they may contain inline scripts for slide control logic).
**Alternatives**:
- Sanitize all uploads — rejected because SLIDE_CONTROL files contain intentional script/style blocks.
- Client-only validation — rejected; server must be authoritative per constitution.

**Security controls implemented**:
- Runtime type validation for FormData fields (prevent `as` cast bypasses)
- blobUrl null guards before Vercel Blob `del()` calls
- Generic error messages in client responses (raw blob errors logged server-side only)
- CONTENT type uploads run through `validateHtmlContent()` sanitization
- Audit logging on sanitization failures

### 4. List Page Type Badge

**Decision**: Display an MUI `Chip` next to each material's title in `CourseMaterialTable`:
„Inhaltsseite" for `CONTENT`, „Steuerdatei" for `SLIDE_CONTROL`.
**Rationale**: Minimal UI change, high information value. No filter needed at current scale.
**Alternatives**:
- Icon-only indicator — less accessible, harder to interpret.
- Dedicated column — takes horizontal space; chip is more compact inline.

### 5. Edit Page Branching

**Decision**: The edit client component reads `type` from the GET metadata response and renders either
`MaterialForm` (CONTENT) or `SlideControlUploadForm` (SLIDE_CONTROL).
**Rationale**: Single entry point (`/admin/course-material/[id]/edit`), type-driven conditional
rendering. No separate edit routes needed.
**Alternatives**:
- Separate edit routes per type — rejected for URL consistency and code duplication.

### 6. Existing Code Patterns Identified

| Pattern | Location | Reuse Strategy |
|---------|----------|----------------|
| Drag-and-drop upload | `components/participation/ResumeUploader.tsx` | Adapt visual pattern (beige/bronze tokens, progress indicators) |
| Hidden file input | `components/admin/SlideEditorToolbar.tsx` | Reuse click-to-browse pattern |
| Blob upload (server) | `app/api/admin/course-material/route.ts` (POST) | Extend with FormData branch |
| Blob delete + replace | `app/api/admin/course-material/[id]/route.ts` (PUT) | Extend with FormData branch |
| Zod schemas | `lib/schemas/admin/course-material.ts` | Add `type` field + file upload schema |
| Contract tests | `tests/contracts/course-material-api.spec.ts` | Extend with FormData test cases |
| Unit tests | `tests/unit/schemas/course-material.spec.ts` | Add type field + upload schema tests |

### 7. Constitutional Compliance Notes

- **Test-First**: New contract tests for FormData POST/PUT, unit tests for schemas (including MIME charset acceptance).
- **Rollbar**: All error paths in `lib/api/course-material.ts` use `serverInstance.error()` with contextual metadata.
- **Accessibility**: Type selection cards keyboard-navigable via `CardActionArea` (no redundant `aria-label` — visible text label suffices). `CircularProgress` with aria-label.
- **Informal German**: All user-facing text uses "du"/"dein". Error messages in German: "Erstellen fehlgeschlagen", "Ungültige Serverantwort" etc.
- **Design Tokens**: All colors from `lib/design-tokens.ts`. No hardcoded rgba values.
- **E2E**: Playwright tests should cover SLIDE_CONTROL create/edit flows in a future iteration.
