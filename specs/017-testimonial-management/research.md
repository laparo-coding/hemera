# Research: Testimonial Management

**Feature**: 017-testimonial-management  
**Date**: 2025-01-15  
**Status**: Complete

## Database Model Analysis

### Requirements Summary

| Requirement | Database Implication |
|-------------|---------------------|
| One testimonial per booking | Unique constraint on `bookingId` |
| Link to participant | Foreign key to `User` or store `userId` |
| Link to course | Foreign key to `Course` via booking |
| Name display format (A/B/C/D) | Enum field |
| Statement text | Text/VarChar field |
| Profile photo | Cached URL string (from Clerk) |
| Publication status | Enum or Boolean |
| Timestamps | Standard `createdAt`, `updatedAt` |

### Model Options Evaluated

#### Option A: Testimonial linked to Booking (1:1)

```
Testimonial
├── id (cuid)
├── bookingId (unique FK → Booking)
├── statement (text)
├── nameDisplayFormat (enum)
├── cachedPhotoUrl (nullable)
├── cachedDisplayName (computed at write)
├── status (enum: DRAFT/PUBLISHED/HIDDEN)
├── createdAt, updatedAt
```

**Pros:**
- Natural 1:1 relationship enforces "one per booking"
- Direct access to course and user via booking relation
- Consistent with existing `CourseParticipation` pattern
- Simple query: `booking.testimonial`

**Cons:**
- Requires booking to exist (intentional constraint)

#### Option B: Testimonial linked directly to User + Course

```
Testimonial
├── id (cuid)
├── userId (FK → User)
├── courseId (FK → Course)
├── statement, nameDisplayFormat, etc.
├── @@unique([userId, courseId])
```

**Pros:**
- Independent of booking system

**Cons:**
- Cannot verify participant eligibility without separate booking check
- Duplicate constraint logic vs booking's existing `@@unique([userId, courseId])`
- Inconsistent with participation flow pattern

#### Option C: Extend CourseParticipation

Add testimonial fields directly to `CourseParticipation` model.

**Pros:**
- No new table
- Already linked to booking

**Cons:**
- Violates single responsibility (participation ≠ testimonial)
- Bloats participation model
- Harder to query testimonials independently

### Recommendation: Option A (Testimonial → Booking)

**Rationale:**
1. **Consistency**: Mirrors `CourseParticipation` pattern already in schema
2. **Integrity**: Booking guarantees paid participant
3. **Simplicity**: One testimonial per booking via `@unique` on `bookingId`
4. **Query efficiency**: 
   - Course detail page: `SELECT * FROM testimonials WHERE course_id = ? AND status = 'PUBLISHED'`
   - User dashboard: `SELECT * FROM testimonials WHERE booking_id IN (user's bookings)`

### Name Display Format Enum

```prisma
enum NameDisplayFormat {
  FULL_NAME_CITY     // A) "Max Mustermann, Berlin"
  FULL_NAME          // B) "Max Mustermann"
  FIRST_INITIAL      // C) "Max M."
  FIRST_NAME_ONLY    // D) "Max"
}
```

### Status Workflow

```prisma
enum TestimonialStatus {
  DRAFT      // Saved but not submitted
  PENDING    // Submitted, awaiting approval (if moderation enabled)
  PUBLISHED  // Visible on course page
  HIDDEN     // Hidden by admin or user
}
```

For MVP without moderation: `DRAFT` → `PUBLISHED` only.

### Cached Fields Strategy

Store computed display values at write time to avoid Clerk API calls on read:

| Field | Source | Reason |
|-------|--------|--------|
| `cachedDisplayName` | Computed from Clerk + format | Avoid runtime computation |
| `cachedPhotoUrl` | Clerk `imageUrl` | Clerk URLs may change; cache for stability |
| `cachedCity` | Clerk metadata | Only needed for format A |

**Trade-off**: Requires update if user changes profile. Acceptable since testimonials are point-in-time snapshots.

## Decisions

1. **Model**: New `Testimonial` entity with `bookingId` as unique foreign key
2. **Enum**: `NameDisplayFormat` with 4 options (A/B/C/D)
3. **Status**: `TestimonialStatus` enum for workflow flexibility
4. **Caching**: Store computed display name and photo URL at creation
5. **Index**: On `courseId` + `status` for course detail page queries

## Open Questions (Resolved)

- ✅ Edit/delete: Allow editing before publish, soft-delete via HIDDEN status
- ✅ Character limit: 1000 characters (reasonable for testimonials)
- ✅ Moderation: Start with immediate publish, add approval workflow later if needed
- ✅ Missing city for format A: Fall back to format B (full name only)
