# Feature 030: Extended Material Upload

## Status

📋 Spec Phase

## Overview

This specification defines the extended material upload functionality for Hemera. 
The feature adds a new tile for uploading complete HTML content files to the course material upload interface, and extends the tile set to organize material creation/upload options with improved layout.

## Current Reality

The course material upload interface currently supports uploading control files ("Ich möchte eine Steuerdatei hinzufügen").
Existing tile "Ich möchte eine Inhaltsseite anlegen" (from Feature 026) provides the WYSIWYG editor for content creation.

## Goals

- Add a new tile "Ich möchte eine Inhaltsseite hinzufügen" to the upload interface for uploading complete HTML files
- Reorganize material creation/upload tiles in improved two-line layout:
  - **Line 1**: "Ich möchte eine Inhaltsseite hinzufügen." (new; file upload) | "Ich möchte eine Inhaltsseite anlegen." (existing; WYSIWYG editor)
  - **Line 2**: "Ich möchte eine Steuerdatei hinzufügen."
- Reuse icon and functionality pattern from the "Ich möchte eine Steuerdatei hinzufügen" tile
- Existing "Ich möchte eine Inhaltsseite anlegen" tile continues to work as designed (no changes)

## Clarifications

### Session 2026-07-07

- Q: What is the functional difference between "hochladen" and "erstellen" tiles? → A: "Hinzufügen" = upload finished HTML file; "Anlegen" = HTML editor in browser. Final labels: "hinzufügen" (upload) and "anlegen" (editor).
- Q: What are HTML file requirements for upload? → A: Same as "Steuerdatei": only .html files, max 20 MB, no sanitization (stored as-is)
- Q: What type of HTML editor for "Inhaltsseite erstellen"? → A: Reuse existing SlideEditor (WYSIWYG); no changes to editor itself. Label corrected to "anlegen" (consistent with Feature 026)

## Requirements

### HTML Content File Upload (New)

Based on existing "Steuerdatei" pattern from Feature 026:

- UP1: New tile "Ich möchte eine Inhaltsseite hinzufügen" opens an upload form similar to slide control file upload.
- UP2: Only `.html` files are accepted. Maximum file size is 20 MB. Server must validate both file extension and `Content-Type` (`text/html`).
- UP3: Uploaded HTML files are stored as-is in Vercel Blob under pathname pattern `course-material/content/{identifier}.html` with `access: 'public'` — **no sanitization is applied**.
- UP4: Upload form must include:
  - Title field (required)
  - Identifier field (optional, auto-generated; alphanumeric + dashes, max 100 chars; UUID slug fallback if omitted)
  - Drag-and-drop file upload zone with click-to-browse
  - Submit and Cancel buttons
- UP5: Upload API must validate, store in Blob, and persist metadata in DB as `type: 'CONTENT'` material.
- UP6: Error handling follows existing pattern: generic client messages, detailed server-side logging via Rollbar (`serverInstance.error()` from `@/lib/monitoring/rollbar-official`). `console.error` is forbidden in new code (constitution v1.8.0).

### HTML Content Editor (Existing)

- ED1: Existing tile "Ich möchte eine Inhaltsseite anlegen" opens the existing SlideEditor (WYSIWYG editor).
- ED2: This tile continues to work as designed in Feature 026; no changes to editor or functionality.
- ED3: Reuses existing WYSIWYG editor functionality from Feature 023 / Feature 026.

### UI Layout

- LY1: Tiles reorganized in two-line grid:
  - **Line 1**: "Inhaltsseite hinzufügen" (new) | "Inhaltsseite anlegen" (existing)
  - **Line 2**: "Steuerdatei hinzufügen"
- LY2: New upload tile reuses icon and styling from existing "Steuerdatei hinzufügen" tile.

## Non-Goals

- Modifying existing control file upload functionality
- Changes to other course material features
- Extending the edit page for CONTENT uploads (showing file name + download link) — deferred to a future spec

## Acceptance Criteria

- [X] New tile "Ich möchte eine Inhaltsseite hinzufügen" is displayed on the upload interface
- [X] New tile reuses the same icon as the control file tile ("Steuerdatei hinzufügen")
- [X] New tile provides HTML file upload functionality (max 20 MB, `.html` only, no sanitization)
- [X] Existing tile "Ich möchte eine Inhaltsseite anlegen" remains unchanged (opens SlideEditor)
- [X] Tiles are arranged in the correct layout (2 tiles on first line, 1 on second line)
- [X] Upload of HTML content files works without errors
- [X] Label is consistent: "anlegen" for editor, "hinzufügen" for file upload

## Implementation Notes

The new upload tile should follow the existing design pattern and use the same icon/styling approach as "Ich möchte eine Steuerdatei hinzufügen" but with updated label and HTML file handling logic.

The existing tile "Ich möchte eine Inhaltsseite anlegen" (Feature 026) continues to work unchanged—this feature only adds the new upload tile and reorganizes the layout for better UX.
