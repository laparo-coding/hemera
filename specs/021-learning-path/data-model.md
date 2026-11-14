# Data Model: 021 Learning Path

## Schema Changes

### 1. PaymentStatus Enum Extension

```prisma
enum PaymentStatus {
  PENDING
  PRE_BOOKED   // NEW: Awaiting admin review (prerequisite not met)
  PAID
  FAILED
  CANCELLED
  REFUNDED
  CONFIRMED
}
```

**Migration SQL:**

```sql
ALTER TYPE "PaymentStatus" ADD VALUE 'PRE_BOOKED' AFTER 'PENDING';
```

### 2. Course Model Extension

```prisma
model Course {
  // ... existing fields ...
  
  // NEW: Learning Path fields (021)
  recommended     String?  @map("recommended") @db.VarChar(300)
  notRecommended  String?  @map("not_recommended") @db.VarChar(300)
  isNonPublic     Boolean  @default(false) @map("is_non_public")
  
  // ... existing relations ...
}
```

**Migration SQL:**

```sql
ALTER TABLE courses 
  ADD COLUMN recommended VARCHAR(300),
  ADD COLUMN not_recommended VARCHAR(300),
  ADD COLUMN is_non_public BOOLEAN DEFAULT false NOT NULL;
```

### 3. User Model Extension

```prisma
model User {
  // ... existing fields ...
  
  // NEW: Learning Path fields (021)
  isOutperformer  Boolean  @default(false) @map("is_outperformer")
  
  // ... existing relations ...
}
```

**Migration SQL:**

```sql
ALTER TABLE users 
  ADD COLUMN is_outperformer BOOLEAN DEFAULT false NOT NULL;
```

### 4. Booking Model Extension

```prisma
model Booking {
  // ... existing fields ...
  
  // NEW: Learning Path fields (021)
  reviewedAt      DateTime? @map("reviewed_at")
  reviewedBy      String?   @map("reviewed_by")
  
  // ... existing relations ...
}
```

**Migration SQL:**

```sql
ALTER TABLE bookings 
  ADD COLUMN reviewed_at TIMESTAMP,
  ADD COLUMN reviewed_by VARCHAR(255);
```

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         LEARNING PATH                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────┐ │
│  │    Course    │────────▶│   Booking    │◀────────│   User   │ │
│  ├──────────────┤         ├──────────────┤         ├──────────┤ │
│  │ recommended  │         │paymentStatus │         │isOutperf.│ │
│  │ notRecommend │         │ PRE_BOOKED   │         │          │ │
│  │ isNonPublic  │         │ reviewedAt   │         │          │ │
│  │ level        │         │ reviewedBy   │         │          │ │
│  └──────────────┘         └──────────────┘         └──────────┘ │
│         │                        │                       │      │
│         │                        ▼                       │      │
│         │              ┌──────────────────┐              │      │
│         └─────────────▶│CourseParticipation│◀────────────┘      │
│                        ├──────────────────┤                     │
│                        │ status=COMPLETE  │ ← Prerequisite      │
│                        │ (required for    │   check uses this   │
│                        │  higher levels)  │                     │
│                        └──────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Validation Rules

### Course Fields

| Field            | Validation                       |
| ---------------- | -------------------------------- |
| `recommended`    | Optional, max 300 chars, trimmed |
| `notRecommended` | Optional, max 300 chars, trimmed |
| `isNonPublic`    | Boolean, default false           |

### User Fields

| Field            | Validation             |
| ---------------- | ---------------------- |
| `isOutperformer` | Boolean, default false |

### Booking Fields

| Field           | Validation                                |
| --------------- | ----------------------------------------- |
| `paymentStatus` | Must be valid enum value                  |
| `reviewedAt`    | Optional, set when admin reviews          |
| `reviewedBy`    | Optional, Clerk userId of reviewing admin |

## State Transitions

### Booking Status for Prerequisite Flow

```
┌───────────────────────────────────────────────────────────────┐
│                    BOOKING STATE MACHINE                       │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  [Customer Books]                                              │
│        │                                                       │
│        ▼                                                       │
│  ┌─────────────┐                                               │
│  │ Check Level │                                               │
│  └─────────────┘                                               │
│        │                                                       │
│   ┌────┴────┐                                                  │
│   │         │                                                  │
│   ▼         ▼                                                  │
│ BEGINNER  INTERMEDIATE/ADVANCED                                │
│   │         │                                                  │
│   │    ┌────┴────┐                                             │
│   │    │         │                                             │
│   │    ▼         ▼                                             │
│   │  Qualified  Not Qualified                                  │
│   │    │         │                                             │
│   │    │         ▼                                             │
│   │    │   ┌───────────┐                                       │
│   │    │   │PRE_BOOKED │──────┐                                │
│   │    │   └───────────┘      │                                │
│   │    │         │            │                                │
│   │    │    ┌────┴────┐       │                                │
│   │    │    │         │       │                                │
│   │    │    ▼         ▼       │                                │
│   │    │  Approve   Reject    │                                │
│   │    │    │         │       │                                │
│   ▼    ▼    ▼         ▼       │                                │
│ ┌─────────┐    ┌───────────┐  │                                │
│ │ PENDING │    │ CANCELLED │  │ (Email sent)                   │
│ └─────────┘    └───────────┘  │                                │
│      │                        │                                │
│      ▼                        │                                │
│ ┌─────────┐                   │                                │
│ │  PAID   │ (via Stripe)      │                                │
│ └─────────┘                   │                                │
│                               │                                │
└───────────────────────────────┴────────────────────────────────┘
```

## Prerequisite Check Logic

### Level Hierarchy

```
BEGINNER (Basis)
    ↓ must complete to unlock
INTERMEDIATE (Fortgeschrittene)
    ↓ must complete to unlock
ADVANCED (Masterclass)
```

### Check Algorithm

```typescript
// Input: Clerk User ID, Target Course Level
// Output: { qualified: boolean, missingLevel, completedCourses }

1. If targetLevel === 'BEGINNER':
   → return { qualified: true }

2. Get all email addresses from Clerk user account

3. Find all bookings where:
   - user.email IN (clerkEmails)
   - paymentStatus = 'PAID'
   - participation.status = 'COMPLETE'
   - course.level = requiredLevel
   
   Where requiredLevel = 
     - 'BEGINNER' if targetLevel === 'INTERMEDIATE'
     - 'INTERMEDIATE' if targetLevel === 'ADVANCED'

4. If count > 0:
   → return { qualified: true, completedCourses: [...] }
   
5. Else:
   → return { qualified: false, missingLevel: requiredLevel }
```

## Indexes

No new indexes required. Existing indexes are sufficient:

- `courses.level` - implicit from enum
- `bookings.payment_status` - may benefit from index for pending review queries
- `course_participations.user_id + status` - existing index covers prerequisite check

## Migration Strategy

**Single migration file:** `xxx_learning_path`

```sql
-- 1. Add PRE_BOOKED to PaymentStatus enum
ALTER TYPE "PaymentStatus" ADD VALUE 'PRE_BOOKED' AFTER 'PENDING';

-- 2. Course table changes
ALTER TABLE courses 
  ADD COLUMN recommended VARCHAR(300),
  ADD COLUMN not_recommended VARCHAR(300),
  ADD COLUMN is_non_public BOOLEAN DEFAULT false NOT NULL;

-- 3. User table changes
ALTER TABLE users 
  ADD COLUMN is_outperformer BOOLEAN DEFAULT false NOT NULL;

-- 4. Booking table changes
ALTER TABLE bookings 
  ADD COLUMN reviewed_at TIMESTAMP,
  ADD COLUMN reviewed_by VARCHAR(255);

-- 5. Optional: Index for pending review queries
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status) 
  WHERE payment_status = 'PRE_BOOKED';
```

## Zod Schema Updates

### Course Create/Update Schema

```typescript
// lib/schemas/admin/course.ts - additions
export const courseCreateSchema = z.object({
  // ... existing fields ...

  // NEW: Learning Path fields
  recommended: z
    .string()
    .max(300, 'Empfehlung darf maximal 300 Zeichen haben')
    .trim()
    .optional()
    .nullable(),
  notRecommended: z
    .string()
    .max(300, 'Nicht-Empfehlung darf maximal 300 Zeichen haben')
    .trim()
    .optional()
    .nullable(),
  isNonPublic: z.boolean().default(false),
});
```

### User Update Schema

```typescript
// lib/schemas/admin/user.ts - new file
export const userUpdateSchema = z.object({
  isOutperformer: z.boolean().optional(),
});
```

### Booking Review Schema

```typescript
// lib/schemas/admin/booking.ts - additions
export const bookingReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
});
```
