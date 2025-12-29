# Research Findings: Course Assignments Participation Flow

## Prisma Modeling For Participation Lifecycle
- **Decision**: Introduce `CourseParticipation` and `ParticipationDocument` models linked to `Booking` with 1:1 relationship, plus optional override relation to `CourseSummaryAsset` records.
- **Rationale**: `prisma/schema.prisma` currently stops at `Booking`. A dedicated table keeps lifecycle data normalized, supports per-phase timestamps, and isolates résumé metadata without bloating `Booking`.
- **Alternatives considered**: Extending `Booking` with JSON fields (rejected: poor queryability, no versioned résumé handling) and linking participation directly to `User` (rejected: cannot scope per booking when users attend multiple courses).

## Résumé Upload Pipeline
- **Decision**: Reuse Vercel Blob integration pattern from [lib/utils/fileUpload.ts](lib/utils/fileUpload.ts) with a new helper tailored to PDF uploads, enforcing single active résumé per `CourseParticipation` and recording replacements.
- **Rationale**: Existing thumbnail uploader already integrates Rollbar logging, size/type checks, and blob naming. Adapting it ensures consistent observability and keeps upload surface bounded to server handlers.
- **Alternatives considered**: Direct Clerk file storage (rejected: adds dependency and billing), storing résumé in Prisma via base64 (rejected: large payloads, slow queries), multi-file version history (rejected: spec mandates single active résumé).

## Mux Summary Asset Handling
- **Decision**: Persist course-level defaults in `CourseSummaryAsset` with optional booking-specific overrides represented via join table referencing Mux asset IDs.
- **Rationale**: Spec clarifies hybrid strategy (course defaults + optional overrides). Storing default assets enables fallback when no booking override exists, while a join table avoids duplication. No existing Mux code in repo (grep returned none), so this establishes foundation.
- **Alternatives considered**: Fetching directly from Mux per request (rejected: increases latency, duplicates association logic), embedding asset list in Course JSON (rejected: breaks requirement for override control).

## Multi-Step Participant UI
- **Decision**: Replace mock implementation in [app/my-courses/page.tsx](app/my-courses/page.tsx) with data-driven dashboard sourcing bookings via server actions and rendering a stepper component that hides Summary when no assets exist.
- **Rationale**: Current page uses mock data and disabled buttons. Building a dedicated stepper aligns with FR-007, leverages Material-UI Stepper, and keeps server data fetching centralized.
- **Alternatives considered**: Creating separate routes per step (rejected: extra navigation friction, spec requires guided flow), reusing existing booking components (rejected: none currently cover the multi-step lifecycle).

## Access Control & Observability
- **Decision**: Gate API routes with Clerk role checks mirroring `requireAdmin` pattern, extend to participants/instructors, and standardize Rollbar error capture for new server actions.
- **Rationale**: Constitution mandates Clerk-based auth and Rollbar logging. Existing upload route still uses `console.error`, highlighting need to adopt Rollbar wrapper in new endpoints.
- **Alternatives considered**: Client-side role filtering (rejected: insufficient protection), console logging (rejected: violates constitution).
