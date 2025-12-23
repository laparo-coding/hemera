# Data Model: Course Locations

**Feature**: 015-course-locations
**Date**: 2025-12-23

## Location Entity

### Prisma Schema

```prisma
model Location {
  id           String    @id @default(cuid())
  slug         String    @unique
  name         String
  description  String?
  address      String
  zipCode      String?   @map("zip_code")
  city         String
  email        String?
  phone        String?
  website      String?
  imageUrl     String?   @map("image_url")
  roomImageUrl String?   @map("room_image_url")
  latitude     Float?
  longitude    Float?
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  courses      Course[]

  @@map("locations")
}
```

### Field Specifications

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| id | String | Auto | CUID format | Primary key |
| slug | String | Auto | Unique, lowercase, URL-safe | Generated from name |
| name | String | Yes | Min 1, Max 200 | Display name |
| description | String | No | Max 2000 | Venue description |
| address | String | Yes | Min 1, Max 500 | Street address |
| zipCode | String | No | Max 20 | Postal/ZIP code |
| city | String | Yes | Min 1, Max 100 | City name |
| email | String | No | Email format | Contact email |
| phone | String | No | Max 50 | Contact phone |
| website | String | No | URL format | Website URL |
| imageUrl | String | No | URL format | Exterior image |
| roomImageUrl | String | No | URL format | Interior image |
| latitude | Float | No | -90 to 90 | From Nominatim |
| longitude | Float | No | -180 to 180 | From Nominatim |
| createdAt | DateTime | Auto | ISO 8601 | Creation timestamp |
| updatedAt | DateTime | Auto | ISO 8601 | Update timestamp |

### Database Column Mapping

| Prisma Field | DB Column | DB Type |
|--------------|-----------|---------|
| id | id | VARCHAR(30) |
| slug | slug | VARCHAR(255) |
| name | name | VARCHAR(200) |
| description | description | TEXT |
| address | address | VARCHAR(500) |
| zipCode | zip_code | VARCHAR(20) |
| city | city | VARCHAR(100) |
| email | email | VARCHAR(255) |
| phone | phone | VARCHAR(50) |
| website | website | VARCHAR(500) |
| imageUrl | image_url | VARCHAR(500) |
| roomImageUrl | room_image_url | VARCHAR(500) |
| latitude | latitude | FLOAT |
| longitude | longitude | FLOAT |
| createdAt | created_at | TIMESTAMP |
| updatedAt | updated_at | TIMESTAMP |

## Relationship: Course → Location

### Course Model Update

```prisma
model Course {
  // ... existing fields ...
  locationId   String?   @map("location_id")
  location     Location? @relation(fields: [locationId], references: [id])
  
  @@map("courses")
}
```

### Relationship Characteristics

| Aspect | Value |
|--------|-------|
| Type | One-to-Many (Location has many Courses) |
| Required | No (Course.locationId is optional) |
| On Delete | Restrict (prevent deletion if courses exist) |
| Cascade | None |

## Indexes

```prisma
model Location {
  // ... fields ...
  
  @@index([city])
  @@index([name])
  @@map("locations")
}
```

## State Transitions

Location has no explicit state field. Lifecycle:

1. **Created**: Admin creates via form → saved to DB
2. **Active**: Available for Course assignment
3. **Referenced**: One or more Courses point to it
4. **Deletion Blocked**: Cannot delete while referenced
5. **Deleted**: Soft or hard delete when unreferenced

## Validation Rules (Zod Schema)

```typescript
import { z } from 'zod'

export const locationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  address: z.string().min(1).max(500),
  zipCode: z.string().max(20).optional(),
  city: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  roomImageUrl: z.string().url().optional().or(z.literal('')),
})

export const locationCreateSchema = locationSchema

export const locationUpdateSchema = locationSchema.partial()

export type LocationInput = z.infer<typeof locationSchema>
```

## Migration Strategy

1. Create `locations` table with all fields
2. Add `location_id` column to `courses` table (nullable FK)
3. Add foreign key constraint with RESTRICT on delete

```sql
-- Migration: add_locations_table
CREATE TABLE "locations" (
  "id" VARCHAR(30) PRIMARY KEY,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "address" VARCHAR(500) NOT NULL,
  "zip_code" VARCHAR(20),
  "city" VARCHAR(100) NOT NULL,
  "email" VARCHAR(255),
  "phone" VARCHAR(50),
  "website" VARCHAR(500),
  "image_url" VARCHAR(500),
  "room_image_url" VARCHAR(500),
  "latitude" FLOAT,
  "longitude" FLOAT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "locations_city_idx" ON "locations"("city");
CREATE INDEX "locations_name_idx" ON "locations"("name");

-- Add FK to courses
ALTER TABLE "courses" ADD COLUMN "location_id" VARCHAR(30);
ALTER TABLE "courses" ADD CONSTRAINT "courses_location_id_fkey" 
  FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;
```
