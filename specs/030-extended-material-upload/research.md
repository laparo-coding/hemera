# Research: Extended Material Upload (Feature 030)

## Overview

Research conducted during Phase 0 of Feature 030 planning. All clarifications from spec phase are documented; no NEEDS CLARIFICATION remain.

## Research Topics

### 1. HTML Upload Pattern Reuse from Feature 026

**Decision**: Reuse existing slide control file upload pattern (Feature 026).

**Rationale**:
- Minimizes code duplication
- Consistent with repository architecture patterns
- Proven validation + error handling approach
- Users already familiar with Blob storage workflow

**Source**:
- Feature 026 Spec: `app/admin/course-material/` upload handler
- Implementation: `lib/api/course-materials.ts` (PUT handler)

**Key Constraints Applied**:
- File type: `.html` only (extension + Content-Type validation)
- File size: Max 20 MB
- Storage: Vercel Blob `course-material/content/{identifier}.html`
- Sanitization: None (stored as-is, matching Feature 026 for slide control files)

### 2. Type Differentiation Strategy

**Decision**: Use existing `CourseMaterialType` enum; both upload and editor store as `CONTENT`.

**Rationale**:
- Spec clarification resolved: "anlegen" (editor) and "hinzufügen" (upload) are different UI entry points, same data type
- No DB schema changes needed (type field already exists from Feature 026)
- Simplifies query logic (no separate type needed for upload-created content)

**Storage Pattern**:
```
CourseMaterial {
  type: CONTENT  // Both editor-created and upload-created materials
  blobPathname: "course-material/content/{identifier}.html"  // New path for uploads
}
```

### 3. UI Layout Organization

**Decision**: CSS Grid with 2-1 layout (2 tiles first row, 1 second row).

**Rationale**:
- Organizes related actions: both content material options on first row
- Secondary action (control file) on second row
- Reuses icon/color scheme from existing tile for visual consistency

**Component Approach**:
- New `MaterialTypeSelection` component renders all 3 tiles
- Reuses MUI styling from Feature 026
- No new icon assets needed (reuse existing)

### 4. Error Handling & Logging

**Decision**: Generic client messages; detailed server-side logging (Feature 026 pattern).

**Rationale**:
- Consistent with existing upload error handling
- Protects internal details from leaking to client UI
- Supports troubleshooting via server logs

**Pattern**:
- Client receives: "Upload fehlgeschlagen. Bitte versuchen Sie es später erneut."
- Server logs: Full error details (Blob API response, validation reason, etc.)

### 5. Testing Strategy

**Decision**: Contract tests (API), Integration tests (upload flow), E2E tests (UI).

**Rationale**:
- Contract tests ensure API specification compliance
- Integration tests validate full upload flow (file → storage → DB)
- E2E tests confirm UI layout and user interactions

**Test Framework**:
- Vitest: contract + integration tests
- Playwright: E2E tests
- Existing test setup from hemera (no new dependencies needed)

## Alternatives Considered

| Alternative | Why Not Chosen |
|-------------|----------------|
| Sanitize HTML on upload | Spec explicitly requires "no sanitization"; matches Feature 026 pattern |
| Create new `CONTENT_UPLOAD` type | Overcomplicates data model; both storage patterns identical |
| Custom file upload component | Existing Pattern from Feature 026 proven; reusing reduces maintenance burden |
| 3-column grid layout | 2-1 layout better matches action hierarchy and screen real estate |

## Conclusion

All research topics resolved. No blocking unknowns. Ready to proceed to Phase 1 (Design).
