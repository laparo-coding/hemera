# Specification: Course Material Integration (Spec 026)

## Goal

Harden the course-material editing surface introduced in Spec 023 (Slide Editor) by extracting
client-side logic into a dedicated client component, improving error handling, accessibility,
and aligning UI code with the project's design-token strategy.

Additionally, extend the course-material creation and editing flow to support **two material
types**: rich-text content pages (existing) and uploaded slide control files (new).

## Background

The Slide Editor (023) shipped a working admin editor for course materials. During integration
review several quality issues surfaced:

- Silent failure when fetching material content (non-OK responses cleared the editor).
- Missing accessibility attributes on loading spinners.
- Redundant loading strategies (Suspense + dynamic `loading` callback + `ssr: true`).
- Internal Blob Storage error details leaked to the client via API responses.
- Hardcoded `rgba()` color values scattered across dashboard, booking, and participation
  components instead of using centralized design tokens.
- Formal German ("Sie") used inconsistently alongside informal ("Du").
- Invalid JSON syntax in `vercel.json`.

The current `CourseMaterial` model stores HTML content uploaded to Vercel Blob. Both material
types — content pages and slide control files — are HTML files. Content pages are authored
via the WYSIWYG SlideEditor; slide control files are pre-built HTML files uploaded as-is.
The creation flow currently goes directly to the HTML editor without offering a choice between
the two workflows.

## Clarifications

### Session 2026-03-19

- Q: Soll die Listenseite (`/admin/course-material`) den Materialtyp anzeigen und/oder filtern? → A: Typ-Badge anzeigen (Chip „Inhaltsseite" / „Steuerdatei"), kein Filter.
- Q: Soll der DB-Enum-Wert `SLIDE_CONTROL` bleiben oder umbenannt werden? → A: `SLIDE_CONTROL` beibehalten; Beschreibung in MT3 von „binary file" zu „HTML file" korrigiert.

## Requirements

### Material Type Selection (New)

- MT1: When the admin navigates to create new course material (`/admin/course-material/new`), a
  **type selection screen** must be shown with two options:
  - **(A) „Ich möchte eine Inhaltsseite anlegen."** — opens the existing rich-text editor
    (`MaterialForm` with `SlideEditor`).
  - **(B) „Ich möchte eine Steuerdatei hinzufügen."** — opens a new upload page for slide
    control files.
- MT2: The selection UI must be visually consistent with the existing create page (same layout,
  typography, spacing, and design tokens). Use card-based buttons or a similar prominent choice
  pattern.
- MT3: The `CourseMaterial` Prisma model must be extended with a `type` field to distinguish
  between material types:
  - `CONTENT` — rich-text HTML (existing behavior, default).
  - `SLIDE_CONTROL` — uploaded HTML file (slide control, stored as-is).
- MT4: The type must be persisted when creating a new material and must not be changeable after
  creation.

### Slide Control File Upload (New)

- SU1: The upload page for option (B) must include:
  - A title field (required, same validation as `MaterialForm`).
  - An identifier field (optional, auto-generated — same behavior as `MaterialForm`).
  - A **file upload section** styled identically to the existing curriculum upload pattern
    (drag-and-drop zone with click-to-browse, upload progress indicator, file-name display
    after upload).
  - Submit and Cancel buttons matching the `MaterialForm` layout.
- SU2: The uploaded HTML file must be stored in Vercel Blob under the pathname pattern
  `course-material/slides/{identifier}.html` with `access: 'public'`.
- SU3: Only `.html` files are accepted. Maximum file size is 20 MB. The server must validate
  both the file extension and the `Content-Type` (`text/html`).
- SU4: The upload API (new or extended `POST /api/admin/course-material`) must:
  - Accept `FormData` with fields `title`, `identifier` (optional), and `file` (HTML file).
  - Validate the file (type `.html`, size ≤ 20 MB) server-side before uploading to Blob.
  - Store the resulting `blobUrl` and `blobPathname` in the DB with `type: 'SLIDE_CONTROL'`.
  - Return the created material metadata on success.
- SU5: The uploaded HTML file is stored as-is — **no sanitization or WYSIWYG processing** is
  applied, unlike `CONTENT` materials which go through `sanitizeHtml()`.
- SU6: Error handling must follow the same pattern as the existing HTML upload: generic client
  messages, detailed server-side logging.

### List Page (New)

- LP1: The material list page (`/admin/course-material`) must display a type badge (MUI `Chip`)
  next to each material's title: „Inhaltsseite" for `CONTENT`, „Steuerdatei" for `SLIDE_CONTROL`.
- LP2: No type filter is needed at this stage (deferred to a future spec if volume grows).

### Edit Page Extension (New)

- EP1: The edit page (`/admin/course-material/[id]/edit`) must detect the material's `type` and
  render the appropriate editor:
  - `CONTENT` → existing `MaterialForm` with `SlideEditor` (no change).
  - `SLIDE_CONTROL` → a form with the title/identifier fields plus a file replacement section
    showing the current file name and allowing upload of a new HTML file (no inline editing).
- EP2: For `SLIDE_CONTROL` materials, the edit page must show the currently uploaded file name
  (derived from `blobPathname`) and provide a download link to the current file.
- EP3: Uploading a new HTML file on the edit page must replace the existing Blob (delete old,
  upload new) following the same pattern as the existing PUT handler.
- EP4: The material type (`CONTENT` vs `SLIDE_CONTROL`) is **immutable after creation** and must
  not be changeable on the edit page.

### Robustness

- R1: When the content fetch (`/api/admin/course-material/[id]/content`) fails, the editor must
  surface a user-visible error and preserve any previously loaded HTML content.
- R2: The Blob Storage upload error route (`PUT /api/admin/course-material/[id]`) must log the full
  internal error server-side but return only a generic message to the client.
- R3: `vercel.json` must be valid JSON.

### Accessibility

- A1: All `CircularProgress` loading indicators in the course-material edit flow must carry an
  `aria-label` and an appropriate ARIA live-region announcement (`role="status"` or `aria-live`).
- A2: The type selection screen must be keyboard-navigable and have proper focus management.

### Architecture

- AR1: The dynamic import for `EditCourseMaterialClient` must use `ssr: false` with the `loading`
  callback as the single loading strategy (no wrapping `<Suspense>`).
- AR2: The client component (`edit-client.tsx`) owns all form state and fetch logic.
- AR3: The create page (`new/page.tsx`) must be a server component. It loads
  `create-client.tsx` via `dynamic(() => import('./create-client'), { ssr: false })`,
  following the same pattern as `edit/page.tsx` → `EditCourseMaterialClient`. The client
  component owns type selection state and conditionally renders either `MaterialForm` or
  `SlideControlUploadForm`.

### Design Tokens

- DT1: All hardcoded `rgba(22, 64, 77, …)` values across components must be replaced with named
  tokens from `lib/design-tokens.ts` (e.g., `tealAlpha4`, `tealAlpha10`).
- DT2: All hardcoded hex/rgba values for bronze hover and rosy-pink accents must be replaced with
  tokens (`bronzeHoverLight`, `rosyPink`).
- DT3: Import order in components must follow the project convention: external libraries first,
  then internal modules (path-alias imports grouped together).

### Copy / i18n

- C1: All user-facing text must use informal German ("Du" / "du", not "Sie").
- C2: The type selection labels must read exactly:
  - (A) „Ich möchte eine Inhaltsseite anlegen."
  - (B) „Ich möchte eine Steuerdatei hinzufügen."

## Acceptance Criteria

### Existing (Quality Hardening)

- [ ] Non-OK content fetch sets an error state; HTML content is not cleared.
- [ ] `CircularProgress` elements in the edit flow have `aria-label` and live-region attributes.
- [ ] `EditCourseMaterialClient` is loaded with `ssr: false`; no `<Suspense>` wrapper.
- [ ] Blob Storage error response contains no internal details; server logs the full message.
- [ ] No hardcoded `rgba(22, 64, 77, …)` or `#E8B4B8` values remain in touched components.
- [ ] New design tokens (`tealAlpha4/8/10/12`, `bronzeHoverLight`, `rosyPink`) exist in
  `lib/design-tokens.ts`.
- [ ] `vercel.json` is valid JSON.
- [ ] Informal German is used consistently in `SummaryAssetList`.
- [ ] `npm run lint` and `npm run typecheck` pass without new errors.

### New (Material Type Selection & File Upload)

- [ ] Navigating to `/admin/course-material/new` shows a type selection screen with options (A)
  and (B).
- [ ] Selecting (A) renders the existing `MaterialForm` with `SlideEditor`.
- [ ] Selecting (B) renders a file upload form with title, identifier, drag-and-drop upload zone.
- [ ] The upload zone matches the visual style of the existing curriculum upload pattern.
- [ ] Slide control HTML files are uploaded to Vercel Blob under `course-material/slides/`.
- [ ] Only `.html` files are accepted for slide control upload; server validates type and size
  (max 20 MB).
- [ ] Uploaded slide control files are stored as-is (no HTML sanitization).
- [ ] The `CourseMaterial` DB model includes a `type` field (`CONTENT` | `SLIDE_CONTROL`).
- [ ] A Prisma migration creates the `type` column with default `CONTENT`.
- [ ] The edit page renders the correct editor based on the material's `type`.
- [ ] For `SLIDE_CONTROL` materials, the edit page shows the current file name, a download
  link, and allows replacement upload.
- [ ] The material type is immutable after creation.
- [ ] The type selection screen is keyboard-navigable.
- [ ] The material list page shows a type badge (Chip) per material: „Inhaltsseite" / „Steuerdatei".

## Data Model Changes

### `CourseMaterial` — new field

```prisma
model CourseMaterial {
  // … existing fields …
  type  String @default("CONTENT") @map("type")   // "CONTENT" | "SLIDE_CONTROL"
}
```

A migration must add the column with default `'CONTENT'` so existing rows are unaffected.

## Affected Files

| Area | Files |
|------|-------|
| List page | `app/admin/course-material/page.tsx` (type badge) |
| Create flow | `app/admin/course-material/new/page.tsx` (type selection) |
| Create client | `app/admin/course-material/new/create-client.tsx` (new) |
| Editor | `app/admin/course-material/[id]/edit/edit-client.tsx`, `…/edit/page.tsx` |
| API (create) | `app/api/admin/course-material/route.ts` (extend POST for FormData) |
| API (update) | `app/api/admin/course-material/[id]/route.ts` (extend PUT for file replacement) |
| Schema | `prisma/schema.prisma` (`CourseMaterial.type` field) |
| Migration | `prisma/migrations/…_add_material_type/` |
| Tokens | `lib/design-tokens.ts` |
| Components | `BookingCTA`, `CourseCard` (dashboard), `DashboardSection`, `PublicNavigation`, `ResumeUploader`, `SummaryAssetList` |
| Config | `vercel.json` |

## Non-Goals

- No changes to the Slide Editor's rich-text editing capabilities.
- No migration of components outside the affected set.
- No inline WYSIWYG editing of slide control files (they are uploaded/replaced as whole files).
- No conversion between material types after creation.

## Dependencies

- Spec 023 (Slide Editor) – base implementation.
- `@vercel/blob` – already used for HTML content and image uploads.
