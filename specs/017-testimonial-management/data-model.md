# Data Model: Testimonial Management

**Feature**: 017-testimonial-management  
**Date**: 2025-01-15  
**Status**: Complete

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│    User     │       │   Course    │       │    Location     │
│             │       │             │       │                 │
│ id          │       │ id          │◄──────│ id              │
│ name        │       │ title       │       │ city            │
│ email       │       │ slug        │       └─────────────────┘
│ image       │       │ ...         │
└──────┬──────┘       └──────┬──────┘
       │                     │
       │    ┌────────────────┤
       │    │                │
       ▼    ▼                │
┌─────────────────┐          │
│     Booking     │          │
│                 │          │
│ id              │          │
│ userId ─────────┼──────────┘
│ courseId ───────┤
│ paymentStatus   │
│ ...             │
└────────┬────────┘
         │
         │ 1:1 (unique)
         ▼
┌─────────────────────────┐
│      Testimonial        │
│                         │
│ id                      │
│ bookingId (unique FK)   │──► Booking
│ courseId (FK) ──────────┼──► Course (denormalized for query)
│ statement               │
│ nameDisplayFormat       │
│ cachedDisplayName       │
│ cachedPhotoUrl          │
│ cachedCity              │
│ status                  │
│ createdAt               │
│ updatedAt               │
└─────────────────────────┘
```

## Entities

### Testimonial

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | String | @id @default(cuid()) | Primary key |
| `bookingId` | String | @unique FK → Booking | Links to participant's booking |
| `courseId` | String | FK → Course | Denormalized for efficient course page queries |
| `statement` | String | @db.VarChar(1000) | Testimonial text content |
| `nameDisplayFormat` | NameDisplayFormat | enum | How participant name is displayed |
| `cachedDisplayName` | String | | Pre-computed display name |
| `cachedPhotoUrl` | String? | nullable | Profile photo URL from Clerk |
| `cachedCity` | String? | nullable | City for format A display |
| `status` | TestimonialStatus | enum, default DRAFT | Publication workflow state |
| `createdAt` | DateTime | @default(now()) | Creation timestamp |
| `updatedAt` | DateTime | @updatedAt | Last update timestamp |

### Enums

#### NameDisplayFormat

| Value | Display Example | Description |
|-------|-----------------|-------------|
| `FULL_NAME_CITY` | "Max Mustermann, Berlin" | Option A: Full name + city |
| `FULL_NAME` | "Max Mustermann" | Option B: Full name only |
| `FIRST_INITIAL` | "Max M." | Option C: First name + last initial |
| `FIRST_NAME_ONLY` | "Max" | Option D: First name only |

#### TestimonialStatus

| Value | Description |
|-------|-------------|
| `DRAFT` | Saved but not visible |
| `PUBLISHED` | Visible on course detail page |
| `HIDDEN` | Hidden by user or admin |

## Prisma Schema Addition

```prisma
enum NameDisplayFormat {
  FULL_NAME_CITY
  FULL_NAME
  FIRST_INITIAL
  FIRST_NAME_ONLY
}

enum TestimonialStatus {
  DRAFT
  PUBLISHED
  HIDDEN
}

model Testimonial {
  id                String             @id @default(cuid())
  bookingId         String             @unique @map("booking_id")
  courseId          String             @map("course_id")
  statement         String             @db.VarChar(1000)
  nameDisplayFormat NameDisplayFormat  @map("name_display_format")
  cachedDisplayName String             @map("cached_display_name")
  cachedPhotoUrl    String?            @map("cached_photo_url")
  cachedCity        String?            @map("cached_city")
  status            TestimonialStatus  @default(DRAFT)
  createdAt         DateTime           @default(now()) @map("created_at")
  updatedAt         DateTime           @updatedAt @map("updated_at")

  booking           Booking            @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  course            Course             @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@index([courseId, status])
  @@map("testimonials")
}
```

## Relationships

| From | To | Type | Description |
|------|-----|------|-------------|
| Testimonial | Booking | 1:1 | Each booking can have one testimonial |
| Testimonial | Course | N:1 | Many testimonials per course |
| Booking | Testimonial | 1:0..1 | Optional testimonial per booking |

## Required Schema Changes

### Booking Model Extension

```prisma
model Booking {
  // ... existing fields ...
  testimonial       Testimonial?  // Add optional relation
}
```

### Course Model Extension

```prisma
model Course {
  // ... existing fields ...
  testimonials      Testimonial[]  // Add relation
}
```

## Migration Notes

1. Add new enums: `NameDisplayFormat`, `TestimonialStatus`
2. Create `testimonials` table with indexes
3. Add foreign key constraints with CASCADE delete
4. No data migration needed (new feature)

## Query Patterns

### Course Detail Page (published testimonials)

```sql
SELECT * FROM testimonials 
WHERE course_id = $1 AND status = 'PUBLISHED'
ORDER BY created_at DESC
LIMIT 10
```

### User Dashboard (user's testimonials)

```sql
SELECT t.*, c.title, c.slug 
FROM testimonials t
JOIN bookings b ON t.booking_id = b.id
JOIN courses c ON t.course_id = c.id
WHERE b.user_id = $1
ORDER BY t.created_at DESC
```

### Check if testimonial exists for booking

```sql
SELECT EXISTS(SELECT 1 FROM testimonials WHERE booking_id = $1)
```
