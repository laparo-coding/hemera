# Data Model: Course Admin Interface

**Feature**: Course Admin Interface  
**Date**: 2025-12-15

## Entity Definitions

### Course (Updated)

Represents an educational offering in the catalog with admin-manageable fields.

**Database Table**: `Course` (Prisma model)

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, @id, @default(cuid()) | Unique identifier |
| title | String | NOT NULL, 3-200 chars | Course title |
| description | String | NOT NULL, @db.Text | Detailed course description |
| price | Decimal | NOT NULL, >=0, @db.Decimal(10,2) | Price in EUR |
| startTime | DateTime | NOT NULL, indexed | Course start date/time (for sorting) |
| duration | Int | NOT NULL, >0 | Duration in hours |
| instructor | String | NOT NULL | Instructor name |
| level | Enum | NOT NULL, CourseLevel | BEGINNER, INTERMEDIATE, ADVANCED |
| thumbnailUrl | String | NULLABLE | Vercel Blob URL for thumbnail image |
| capacity | Int | NOT NULL, >0 | Maximum number of students |
| published | Boolean | NOT NULL, @default(false) | Visibility status |
| createdAt | DateTime | NOT NULL, @default(now()) | Creation timestamp |
| updatedAt | DateTime | NOT NULL, @updatedAt | Last modification timestamp (for optimistic locking) |

**Relationships**:
- `enrollments` → Enrollment[] (one-to-many): Students enrolled in this course
- `bookings` → Booking[] (one-to-many): Booking records for this course

**Indexes**:
- `startTime` (ascending): For efficient sorting in course list
- `published` (for filtering published courses)

**Validation Rules**:
- Title: 3-200 characters, alphanumeric and common punctuation
- Price: Non-negative, max 2 decimal places
- StartTime: Must be future date (validated at creation, not at update)
- Duration: Positive integer, typical range 1-200 hours
- Capacity: Positive integer, typical range 1-100 students
- ThumbnailUrl: Must be valid Vercel Blob URL or null

**State Transitions**:
1. **Draft** (published=false): Course created but not visible to students
2. **Published** (published=true): Course visible in public catalog
3. **Archived** (hypothetical future state): Course completed, read-only

### Enrollment (Existing, Referenced)

Represents a student's enrollment in a course. Used for deletion protection logic.

**Database Table**: `Enrollment` (Prisma model)

**Key Attributes**:
- `id`: Unique identifier
- `userId`: Foreign key to User
- `courseId`: Foreign key to Course
- `enrolledAt`: Enrollment timestamp
- `status`: ACTIVE, COMPLETED, WITHDRAWN

**Admin Interface Usage**:
- Check `Enrollment.count({ where: { courseId, status: 'ACTIVE' } })` before course deletion
- Transfer enrollments: `Enrollment.updateMany({ where: { courseId: oldId }, data: { courseId: newId } })`

### Admin (Implicit via Clerk)

Represents users with admin privileges. Not a separate database entity.

**Implementation**: Clerk user metadata

**Authorization Check**:
```typescript
const { userId, sessionClaims } = auth();
const isAdmin = sessionClaims?.metadata?.role === 'admin';
```

**Admin Assignment**: Managed via Clerk Dashboard
- Navigate to Users → Select user → Metadata → Public Metadata
- Add: `{ "role": "admin" }`

## Prisma Schema Changes

### New Fields for Course Model

```prisma
model Course {
  // ... existing fields ...
  
  // NEW FIELDS
  startTime    DateTime  @db.Timestamptz
  capacity     Int
  thumbnailUrl String?
  
  // Add index
  @@index([startTime])
}

enum CourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}
```

### Migration Strategy

1. **Add optional fields first** (startTime?, capacity?) to allow existing courses to remain valid
2. **Backfill data**: Script to set default startTime (current date + 30 days) and capacity (20) for existing courses
3. **Make fields required**: Second migration removes nullable constraint
4. **Create index**: Add index on startTime column

**Migration File** (`prisma/migrations/<timestamp>_add_course_admin_fields`):
- Add startTime, capacity, thumbnailUrl columns
- Add CourseLevel enum
- Add index on startTime
- Backfill script: `scripts/backfill-course-admin-fields.ts`

## Data Flow Diagrams

### Course Creation Flow

```
Admin Form → Zod Validation → Server Action → Prisma Create → Revalidate → Redirect
                                    ↓
                              Vercel Blob (thumbnail)
                                    ↓
                              Rollbar (audit log)
```

### Course Update Flow

```
Admin Edit Form → Zod Validation → Server Action → Optimistic Lock Check → Prisma Update → Revalidate
                                                          ↓ (conflict)
                                                    Error: "Refresh required"
```

### Course Deletion Flow

```
Admin Delete Request → Check Enrollments
                            ↓ (exists)
                      Block + Show Transfer UI
                            ↓ (transfer complete)
                      Check Enrollments (0)
                            ↓
                      Prisma Delete → Cleanup Blob → Revalidate
```

## Validation Constraints

### Business Rules

1. **Unique Course Titles** (soft constraint): Warn admin if title exists, allow override
2. **Future Start Time** (creation only): StartTime must be >= today at creation
3. **Capacity vs Enrollments**: Capacity must be >= current enrollment count
4. **Price Consistency**: Cannot reduce price below 0 or set to negative
5. **Thumbnail Required for Published**: Cannot publish course without thumbnail

### Database Constraints

- Primary keys: `id` fields (cuid)
- Foreign keys: `courseId` in Enrollment and Booking
- Unique constraints: None (courses can have duplicate titles)
- Check constraints: `price >= 0`, `capacity > 0`, `duration > 0`
- NOT NULL constraints: All required fields except `thumbnailUrl`

## Data Access Patterns

### Admin Operations

1. **List Courses** (sorted by startTime):
   ```typescript
   prisma.course.findMany({
     orderBy: { startTime: 'asc' },
     include: { _count: { select: { enrollments: true } } }
   })
   ```

2. **Get Course by ID** (with enrollment count):
   ```typescript
   prisma.course.findUnique({
     where: { id },
     include: { _count: { select: { enrollments: true } } }
   })
   ```

3. **Create Course**:
   ```typescript
   prisma.course.create({
     data: { title, description, price, startTime, duration, instructor, level, thumbnailUrl, capacity }
   })
   ```

4. **Update Course** (with optimistic locking):
   ```typescript
   prisma.course.update({
     where: { id, updatedAt: formData.updatedAt },
     data: { title, description, price, ... }
   })
   ```

5. **Delete Course** (after enrollment check):
   ```typescript
   const enrollmentCount = await prisma.enrollment.count({
     where: { courseId, status: 'ACTIVE' }
   });
   if (enrollmentCount > 0) throw new Error('Transfer students first');
   
   await prisma.course.delete({ where: { id } });
   ```

6. **Transfer Enrollments**:
   ```typescript
   prisma.enrollment.updateMany({
     where: { courseId: sourceCourseId, status: 'ACTIVE' },
     data: { courseId: targetCourseId }
   })
   ```

## Type Definitions

### TypeScript Types (generated from Prisma)

```typescript
// Auto-generated by Prisma
type Course = {
  id: string;
  title: string;
  description: string;
  price: Decimal;
  startTime: Date;
  duration: number;
  instructor: string;
  level: CourseLevel;
  thumbnailUrl: string | null;
  capacity: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Admin-specific DTOs
type CourseCreateInput = Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'published'>;

type CourseUpdateInput = Partial<CourseCreateInput> & {
  updatedAt: Date; // For optimistic locking
};

type CourseWithEnrollmentCount = Course & {
  _count: { enrollments: number };
};
```

## Performance Considerations

1. **Indexing Strategy**:
   - Primary index on `startTime` for sorting
   - Consider composite index on `(published, startTime)` if filtering by published courses

2. **Caching**:
   - Next.js `revalidatePath('/admin/courses')` after mutations
   - Consider `revalidateTag('course-${id}')` for individual course updates

3. **Query Optimization**:
   - Use `select` to fetch only needed fields (avoid fetching large description in list view)
   - Pagination (future): Limit 20 courses per page with cursor-based pagination

4. **File Storage**:
   - Vercel Blob CDN distributes thumbnails globally
   - Lazy load thumbnail images in course list (MUI ImageList with loading="lazy")

## Security Considerations

1. **Access Control**:
   - All admin routes protected by Clerk middleware checking `role=admin`
   - Prisma queries do not need userId filtering (admin sees all courses)

2. **Input Sanitization**:
   - Zod validation prevents XSS in text fields
   - Thumbnail URLs validated to be from Vercel Blob domain only

3. **Audit Logging**:
   - All create/update/delete operations logged to Rollbar with adminId
   - Include before/after course state for updates

4. **Concurrent Access**:
   - Optimistic locking with `updatedAt` prevents lost updates
   - Database transactions for enrollment transfers

## Next Steps

Proceed to contract generation:
- Define API contracts for admin endpoints
- Create contract tests
- Generate quickstart.md
