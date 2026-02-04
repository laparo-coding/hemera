# Research: Admin Dashboard Redesign

**Feature**: 024-admin-dashboard
**Date**: 2026-02-04

## 1. Clerk Admin SDK - User Listing

### Decision
Use `@clerk/nextjs` server-side functions with `clerkClient.users.getUserList()` for fetching all users.

### Rationale
- Server-side only to protect user data
- Built-in pagination support
- Returns consistent user object structure
- Already used in project for authentication

### Implementation Pattern
```typescript
import { clerkClient } from '@clerk/nextjs/server';

export async function listAllUsers(page = 1, limit = 20) {
  const users = await clerkClient.users.getUserList({
    limit,
    offset: (page - 1) * limit,
  });
  return users;
}
```

### Alternatives Considered
- Direct Clerk REST API: More complex, requires manual auth handling
- Client-side fetching: Security risk, exposes user data

---

## 2. MUI Breadcrumb Component

### Decision
Use MUI `<Breadcrumbs>` component with `<Link>` and `<Typography>` children.

### Rationale
- Native MUI component, consistent with design system
- Built-in accessibility (aria-label, navigation landmark)
- Supports custom separators (using `>` per spec)
- Handles last-item styling automatically

### Implementation Pattern
```typescript
import { Breadcrumbs, Link, Typography } from '@mui/material';
import NextLink from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function AdminBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <Breadcrumbs separator=">" aria-label="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return isLast ? (
          <Typography key={item.label} color="text.primary">
            {item.label}
          </Typography>
        ) : (
          <Link
            key={item.label}
            component={NextLink}
            href={item.href || '#'}
            underline="hover"
            color="inherit"
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
```

### Alternatives Considered
- Custom breadcrumb: Unnecessary complexity
- Third-party library: No benefit over native MUI

---

## 3. MUI Switch for Publish Toggle

### Decision
Use MUI `<Switch>` component instead of current `<Button>` toggle for course publish status.

### Rationale
- Switch semantically represents on/off state better
- Smaller footprint in table rows
- Instant visual feedback
- Accessible with proper labeling
- Per spec requirement TR-10

### Implementation Pattern
```typescript
import { Switch, FormControlLabel } from '@mui/material';

export function CoursePublishSwitch({ 
  isPublished, 
  onChange, 
  loading 
}: { 
  isPublished: boolean; 
  onChange: () => void; 
  loading?: boolean;
}) {
  return (
    <FormControlLabel
      control={
        <Switch
          checked={isPublished}
          onChange={onChange}
          disabled={loading}
          color="success"
        />
      }
      label={isPublished ? 'Veröffentlicht' : 'Unveröffentlicht'}
      labelPlacement="start"
    />
  );
}
```

### Alternatives Considered
- Keep Button: Less intuitive for status toggle
- Chip: Not interactive enough

---

## 4. Statistics Aggregation Queries

### Decision
Create dedicated Prisma queries for dashboard statistics with efficient aggregations.

### Rationale
- Single query per metric type for performance
- Use Prisma `count()` and `groupBy()` for aggregations
- Cache-friendly for refresh button implementation

### Implementation Pattern
```typescript
import { prisma } from '@/lib/db/prisma';

export async function getDashboardStats() {
  const [
    totalBookings,
    totalRevenue,
    courseStats,
    userGrowth,
  ] = await Promise.all([
    // Total bookings
    prisma.booking.count({
      where: { status: 'CONFIRMED' }
    }),
    
    // Total revenue (sum of course prices for confirmed bookings)
    prisma.booking.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { paidAmount: true }
    }),
    
    // Course utilization (bookings per course)
    prisma.booking.groupBy({
      by: ['courseId'],
      _count: { id: true },
      where: { status: 'CONFIRMED' }
    }),
    
    // User growth (registrations per month)
    prisma.$queryRaw`
      SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count
      FROM users
      WHERE created_at > NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `
  ]);

  return {
    totalBookings,
    totalRevenue: totalRevenue._sum.paidAmount || 0,
    courseStats,
    userGrowth,
  };
}
```

### Alternatives Considered
- Real-time calculations: Too slow for dashboard
- Materialized views: Over-engineering for current scale

---

## 5. Layout Constants

### Decision
Create centralized constants file for admin layout values.

### Rationale
- Single source of truth for layout dimensions
- Easy to maintain and update
- Type-safe with TypeScript
- Consistent across all admin pages

### Implementation Pattern
```typescript
// lib/constants/admin.ts

export const ADMIN_LAYOUT = {
  /** Max width for admin content area */
  MAX_WIDTH: 1280,
  
  /** MUI Container maxWidth prop value */
  CONTAINER_MAX_WIDTH: 'lg' as const,
  
  /** Head space for all admin subpages */
  HEAD_SPACE: {
    paddingTop: 4,    // 32px
    paddingBottom: 3, // 24px
    marginBottom: 4,  // 32px
  },
  
  /** Dashboard grid spacing */
  GRID_SPACING: 3,
  
  /** Dashboard card min height */
  CARD_MIN_HEIGHT: 160,
} as const;

export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  USERS: '/admin/users',
  COURSES: '/admin/courses',
  LOCATIONS: '/admin/locations',
  TESTIMONIALS: '/admin/testimonials',
  SETTINGS: '/admin/settings',
  REPORTS: '/admin/reports',
} as const;
```

---

## 6. Existing Components Analysis

### Components to Modify

| Component | Location | Changes Needed |
|-----------|----------|----------------|
| `PublishToggle.tsx` | `components/admin/` | Replace Button with Switch |
| `CourseListWithDelete.tsx` | `components/admin/` | Remove status column, integrate toggle |
| `LocationsTableClient.tsx` | `app/admin/locations/` | Remove search, align with courses |

### Components to Create

| Component | Purpose |
|-----------|---------|
| `AdminBreadcrumb.tsx` | Navigation breadcrumb |
| `AdminPageContainer.tsx` | Wrapper with standard head space |
| `DashboardCard.tsx` | Clickable card for dashboard grid |
| `UserList.tsx` | Clerk user table with outperformer toggle |
| `ReportsPanel.tsx` | Health status and statistics display |

### Existing Assets to Reuse

- `UserOutperformerToggle.tsx` - Already implemented, reuse in UserList
- `/api/health` endpoint - Already returns health data
- Prisma models for Booking, Course, User - Use for statistics

---

## 7. German Localization Checklist

All user-facing strings must be in German. Key translations:

| English | German |
|---------|--------|
| Admin Dashboard | Admin Dashboard |
| User Management | Benutzerverwaltung |
| Course Management | Kursverwaltung |
| Location Management | Standortverwaltung |
| Testimonial Management | Testimonial-Verwaltung |
| System Settings | Systemeinstellungen |
| Reports & Analytics | Berichte & Analysen |
| Published | Veröffentlicht |
| Unpublished | Unveröffentlicht |
| Refresh | Aktualisieren |
| Filter | Filtern |
| Outperformer only | Nur Outperformer |
| Delete | Löschen |
| Edit | Bearbeiten |
| Save | Speichern |
| Cancel | Abbrechen |

---

## Summary

All technical decisions have been made. No NEEDS CLARIFICATION items remain.

**Ready for Phase 1: Design & Contracts**
