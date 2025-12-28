# Data Model: Course Assignments Participation Flow

## Entities

### CourseParticipation
- **id**: `String` (`cuid`) — primary key.
- **bookingId**: `String` — unique reference to `Booking.id` (1:1).
- **userId**: `String` — redundant link to `User.id` (enables quick lookups, kept in sync with booking).
- **courseId**: `String` — redundant link to `Course.id` (for filtering dashboards).
- **status**: `Enum` (`PREPARATION`, `SUMMARY`, `DEBRIEFING`, `RESULT`, `COMPLETE`).
- **preparationIntent**: `String` (max 2000 chars).
- **desiredResults**: `String` (max 2000 chars).
- **lineManagerProfile**: `String` (max 2000 chars).
- **preparationCompletedAt**: `DateTime?`.
- **summaryPresentedAt**: `DateTime?` — timestamp when videos shown.
- **summaryAssetSource**: `Enum` (`COURSE_DEFAULT`, `BOOKING_OVERRIDE`).
- **summaryCompletedAt**: `DateTime?`.
- **debriefingPlan**: `String` (max 2000 chars).
- **salaryDiscussionMonth**: `String` (ISO `YYYY-MM` or enum of month names).
- **resultOutcome**: `String` (max 2000 chars).
- **resultNotes**: `String` (max 2000 chars).
- **resultCompletedAt**: `DateTime?`.
- **resumeDocumentId**: `String?` — nullable FK to `ParticipationDocument` active record.
- **createdAt**: `DateTime` (default now).
- **updatedAt**: `DateTime` (auto updated).

**Relationships**:
- `CourseParticipation` 1:1 `Booking` (unique `bookingId`).
- `CourseParticipation` optional 1:1 `ParticipationDocument` (active résumé).
- `CourseParticipation` has many `ParticipationSummaryOverride` entries (optional).

### ParticipationDocument
- **id**: `String` (`cuid`).
- **participationId**: `String` — FK to `CourseParticipation`.
- **blobUrl**: `String` — Vercel Blob public URL.
- **blobKey**: `String` — internal blob key for deletion.
- **fileName**: `String`.
- **fileSizeBytes**: `Int` (<= 10 MB enforced).
- **mimeType**: `String` (must be `application/pdf`).
- **uploadedAt**: `DateTime`.
- **replacesDocumentId**: `String?` — previous résumé (for audit chain).
- **replacedAt**: `DateTime?` — when superseded.
- **isActive**: `Boolean` (default true).
- **createdByUserId**: `String` — Clerk user performing upload.
- **createdAt**: `DateTime`.
- **updatedAt**: `DateTime`.

**Relationships**:
- Many documents per participation, only one active at a time (enforced by business logic + partial unique index on `participationId` where `isActive = true`).

### CourseSummaryAsset
- **id**: `String` (`cuid`).
- **courseId**: `String` — FK to `Course`.
- **muxAssetId**: `String` — asset identifier.
- **muxPlaybackId**: `String` — playback identifier for streaming.
- **title**: `String`.
- **description**: `String?`.
- **sortOrder**: `Int` (default 0).
- **isActive**: `Boolean` (default true).
- **availableFrom**: `DateTime?`.
- **availableUntil**: `DateTime?`.
- **createdAt**: `DateTime`.
- **updatedAt**: `DateTime`.

### ParticipationSummaryOverride
- **id**: `String` (`cuid`).
- **participationId**: `String` — FK to `CourseParticipation`.
- **courseSummaryAssetId**: `String` — FK to `CourseSummaryAsset` (optional when custom asset defined inline).
- **muxAssetId**: `String?` — allow override asset outside default list.
- **muxPlaybackId**: `String?` — paired with `muxAssetId` when custom.
- **sortOrder**: `Int`.
- **label**: `String`.
- **createdAt**: `DateTime`.
- **updatedAt**: `DateTime`.

## Indexing & Constraints
- `CourseParticipation.bookingId` unique index ensures single participation per booking.
- Composite index on `CourseParticipation` (`userId`, `status`) for dashboard filtering.
- Partial unique index on `ParticipationDocument` (`participationId`) WHERE `isActive = true` to enforce one active résumé.
- `CourseSummaryAsset` index on (`courseId`, `isActive`, `sortOrder`).
- `ParticipationSummaryOverride` composite index on (`participationId`, `sortOrder`).

## State Transitions
- Default status `PREPARATION` on creation.
- Status auto-advances when each step completes (record `*_CompletedAt`).
- Summary step toggled by asset availability: if no default assets and no overrides, backend marks summary as skipped without altering status progression until assets exist.
- Result completion transitions status to `COMPLETE` and locks further automatic transitions while still allowing edits (only timestamps update).

## Audit & Compliance
- All entities include `createdAt`/`updatedAt` for auditing per constitution.
- Résumé replacement captured through `replacesDocumentId` and `replacedAt`, providing an immutable audit trail.
- Clerk user identifiers stored on upload-related records for traceability and access queries.
