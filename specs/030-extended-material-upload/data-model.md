# Data Model: Extended Material Upload (Feature 030)

## Overview

Feature 030 does not introduce new database entities or schema changes. It extends the existing `CourseMaterial` model (from Feature 026) to support a new UI entry point for HTML file uploads.

## Entity Analysis

### CourseMaterial (Existing from Feature 026)

**No schema changes required.**

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | Primary Key | Existing |
| `courseId` | UUID | Foreign Key → Course | Existing |
| `title` | String | Required, 1-255 chars | Existing |
| `identifier` | String | Optional, auto-generated | Existing |
| `type` | Enum | CONTENT \| SLIDE_CONTROL | **Feature 026 already added** |
| `htmlContent` | String | Optional, text | Existing (for CONTENT editor) |
| `blobUrl` | String | Optional | Existing (for SLIDE_CONTROL or CONTENT uploads) |
| `blobPathname` | String | Optional | Existing (for storage tracking) |
| `createdAt` | DateTime | Immutable | Existing |
| `updatedAt` | DateTime | Auto-update | Existing |

### Usage in Feature 030

**New Upload Entry Point**:
- User clicks "Ich möchte eine Inhaltsseite hinzufügen"
- Uploads HTML file via new form
- System creates `CourseMaterial` record with:
  - `type: CONTENT` (same as editor-created content)
  - `blobPathname: "course-material/content/{identifier}.html"` (new path pattern)
  - `blobUrl: "https://..." ` (Blob public URL)
  - `htmlContent: null` (no inline HTML for uploads)

**Existing Entry Point** (unchanged from Feature 026):
- User clicks "Ich möchte eine Inhaltsseite anlegen"
- Edits HTML via SlideEditor
- System creates `CourseMaterial` record with:
  - `type: CONTENT`
  - `htmlContent: "<html>..."` (inline, sanitized)
  - `blobPathname: null` (not used for editor content)
  - `blobUrl: null` (not used for editor content)

### Validation Rules

| Field | Validation |
|-------|-----------|
| `title` | Required; 1-255 characters |
| `identifier` | If provided: alphanumeric + dashes; auto-generated if omitted (UUID slug) |
| `type` | Immutable after creation; must be CONTENT or SLIDE_CONTROL |
| `blobPathname` | Must follow pattern `course-material/(content\|slides)/{identifier}.html` |

### State Transitions

No new state transitions. Material lifecycle remains:
1. Created (initial)
2. Updated (title, content, or file changes)
3. Deleted (cascades to parent Course)

## Relationships

### CourseMaterial ↔ Course

- Existing relationship (unchanged)
- One Course has many CourseMaterials
- Delete Course → cascades delete CourseMaterials

### CourseMaterial ↔ Blob Storage

- New upload pathway stores to `course-material/content/` folder
- Existing pathway stores to `course-material/slides/` folder (Feature 026)
- Both use same storage structure and public URL handling

## No Data Migration Required

The `type` field was added in Feature 026 with default `CONTENT`. All existing course materials have `type: CONTENT`. Feature 030 introduces no new types or migration scenarios.

## Summary

Feature 030 is purely a UI + API extension. The data model is already sufficient; no schema changes, migrations, or new entities needed.
