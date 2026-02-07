# Data Model: Admin Dashboard

**Feature**: 024-admin-dashboard
**Date**: 2026-02-04

## Overview

This feature primarily uses existing data models. No new database tables are required.
The focus is on view models and API response types for the admin UI.

---

## Existing Entities Used

### User (Clerk-managed)
External entity managed by Clerk. Accessed via Clerk SDK.

```typescript
// Clerk User fields used in admin
interface ClerkUserView {
  id: string;
  emailAddresses: { emailAddress: string }[];
  firstName: string | null;
  lastName: string | null;
  createdAt: number;        // Unix timestamp
  lastSignInAt: number | null;
  publicMetadata: {
    role?: 'admin' | 'user';
  };
}
```

### User (Prisma - local extension)
Local user record linking Clerk ID to app-specific data.

```prisma
model User {
  id             String   @id @default(cuid())
  clerkId        String   @unique @map("clerk_id")
  email          String   @unique
  isOutperformer Boolean  @default(false) @map("is_outperformer")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  
  bookings       Booking[]
  
  @@map("users")
}
```

### Course (existing)
```prisma
model Course {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  isPublished Boolean  @default(false) @map("is_published")
  // ... other fields
  
  @@map("courses")
}
```

### Booking (existing)
```prisma
model Booking {
  id         String        @id @default(cuid())
  userId     String        @map("user_id")
  courseId   String        @map("course_id")
  status     BookingStatus @default(PENDING)
  paidAmount Int?          @map("paid_amount") // in cents
  createdAt  DateTime      @default(now()) @map("created_at")
  
  user       User          @relation(fields: [userId], references: [id])
  course     Course        @relation(fields: [courseId], references: [id])
  
  @@map("bookings")
}
```

---

## View Models (API Response Types)

### AdminUserListItem
Combined view of Clerk user data + local user extension.

```typescript
interface AdminUserListItem {
  id: string;              // Clerk user ID
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;        // Computed: firstName + lastName or email
  role: 'admin' | 'user';
  isOutperformer: boolean; // From local User table
  createdAt: string;       // ISO date
  lastSignInAt: string | null;
}
```

### AdminUserListResponse
Paginated user list response.

```typescript
interface AdminUserListResponse {
  users: AdminUserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### DashboardStats
Statistics for Reports & Analytics.

```typescript
interface DashboardStats {
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    thisMonth: number;
  };
  revenue: {
    total: number;         // in cents
    thisMonth: number;
    currency: 'EUR';
  };
  courses: {
    total: number;
    published: number;
    utilization: CourseUtilization[];
  };
  users: {
    total: number;
    newThisMonth: number;
    growth: MonthlyGrowth[];
  };
}

interface CourseUtilization {
  courseId: string;
  courseTitle: string;
  bookingCount: number;
  capacity: number | null;
  utilizationPercent: number | null;
}

interface MonthlyGrowth {
  month: string;  // YYYY-MM format
  count: number;
}
```

### HealthStatus
Extended health status for admin display.

```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: ServiceCheck;
    clerk: ServiceCheck;
    stripe: ServiceCheck;
  };
}

interface ServiceCheck {
  status: 'ok' | 'error';
  latency?: number;  // ms
  message?: string;
}
```

---

## State Transitions

### Course Publication State
```
UNPUBLISHED <--toggle--> PUBLISHED
     │                        │
     └──── Direct toggle ─────┘
```
- Toggle via API PATCH /api/admin/courses/[id]
- No intermediate states
- Immediate effect on public visibility

### User Role Assignment
```
USER <--assign--> ADMIN
  │                  │
  └── Via Clerk ─────┘
```
- Managed via Clerk publicMetadata
- Requires Clerk Backend API call
- Only admins can assign roles

---

## Validation Rules

### User Actions
| Action | Validation |
|--------|------------|
| Delete user | Cannot delete self |
| Assign admin role | Must be admin |
| Toggle outperformer | Must be admin |

### Course Actions
| Action | Validation |
|--------|------------|
| Toggle publish | Course must exist |
| Link material | Material must exist |

---

## Relationships Diagram

```
┌─────────────────────┐
│   Clerk (External)  │
│   - User accounts   │
│   - Authentication  │
│   - Roles metadata  │
└─────────┬───────────┘
          │ clerkId
          ▼
┌─────────────────────┐
│   User (Local DB)   │
│   - isOutperformer  │
│   - App preferences │
└─────────┬───────────┘
          │ userId
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│      Booking        │────▶│       Course        │
│   - status          │     │   - isPublished     │
│   - paidAmount      │     │   - curriculum      │
└─────────────────────┘     └─────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────────┐
                            │   CourseMaterial    │
                            │   - PDF/Video links │
                            └─────────────────────┘
```

---

## No Schema Changes Required

This feature does not require database migrations. All necessary fields exist:
- `User.isOutperformer` - Added in Spec 014/021
- `Course.isPublished` - Existing field
- `CourseMaterial` - Added in Spec 016

The implementation focuses on:
1. New API endpoints for aggregated views
2. UI components for admin dashboard
3. Integration with Clerk Backend API for user listing
