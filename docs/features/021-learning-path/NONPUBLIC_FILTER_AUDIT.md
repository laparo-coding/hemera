# isNonPublic Filter Audit – Preventing Accidental Exposure

## Overview

This document audits all public-facing endpoints and builders to ensure `isNonPublic: false` filtering prevents accidental exposure of Learning Path invite-only courses.

**Feature:** 021-learning-path  
**Last Audit:** 2026-01-27

---

## ✅ Protected Public Endpoints

### 1. Public Course Listings

**File:** `lib/services/courses.ts`

```typescript
export async function getCourses(): Promise<CourseWithBookings[]> {
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      isNonPublic: false, // ✅ Filtered
    },
    // ...
  });
}
```

**Usage:** `/api/courses` route  
**Protection:** ✅ Complete

---

### 2. Course Search

**File:** `lib/services/course.ts`

```typescript
export async function searchCourses(query: string): Promise<CourseWithBookings[]> {
  return await prisma.course.findMany({
    where: {
      isPublished: true,
      isNonPublic: false, // ✅ Filtered
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    // ...
  });
}
```

**Usage:** Search functionality  
**Protection:** ✅ Complete

---

### 3. Parameterized Course Fetching

**File:** `lib/services/course.ts`

```typescript
export async function getCourses(params?: CourseSearchParams): Promise<CourseWithBookings[]> {
  const where: Record<string, unknown> = {
    isNonPublic: false, // ✅ Filtered by default
  };
  
  // Additional filters (title, price range, etc.)
  // ...
  
  const courses = await prisma.course.findMany({ where, /* ... */ });
}
```

**Usage:** Various filtering scenarios  
**Protection:** ✅ Complete

---

### 4. Available Courses (with spots)

**File:** `lib/services/course.ts`

```typescript
export async function getAvailableCourses(): Promise<CourseWithBookings[]> {
  return getCourses({ availableOnly: true });
  // ✅ Inherits isNonPublic: false from getCourses()
}
```

**Usage:** Course availability checks  
**Protection:** ✅ Inherited from `getCourses()`

---

### 5. Course Detail by ID

**File:** `lib/services/course.ts`

```typescript
export async function getCourseById(
  id: string,
  options?: { includeNonPublic?: boolean }
): Promise<CourseWithBookings | null> {
  const where: Record<string, unknown> = { id };
  
  // ✅ Exclude non-public by default (admin can override)
  if (!options?.includeNonPublic) {
    where.isNonPublic = false;
  }
  
  return await prisma.course.findUnique({ where: where as { id: string }, /* ... */ });
}
```

**Usage:** Admin and public endpoints  
**Protection:** ✅ Opt-in override for admins only

---

### 6. Course Detail by ID or Slug

**File:** `lib/services/course.ts`

```typescript
export async function getCourseByIdOrSlug(
  idOrSlug: string,
  options?: { includeNonPublic?: boolean }
): Promise<CourseWithBookings | null> {
  const where: Record<string, unknown> = {
    OR: [{ id: idOrSlug }, { slug: idOrSlug }],
  };
  
  // ✅ Exclude non-public by default
  if (!options?.includeNonPublic) {
    where.isNonPublic = false;
  }
  
  return await prisma.course.findFirst({ where, /* ... */ });
}
```

**Usage:** Flexible course lookup  
**Protection:** ✅ Opt-in override for admins only

---

## ✅ Protected API Routes

### 7. Homepage Featured Courses

**File:** `lib/api/courses.ts`

```typescript
export async function getFeaturedCourses(limit = 3): Promise<Course[]> {
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      isNonPublic: false, // ✅ Filtered
    },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
    take: limit,
  });
}
```

**Usage:** Homepage course carousel  
**API Route:** N/A (direct SSR)  
**Protection:** ✅ Complete

---

### 8. Next Upcoming Course

**File:** `lib/api/courses.ts`

```typescript
export async function getNextUpcomingCourse(): Promise<Course | null> {
  const course = await prisma.course.findFirst({
    where: {
      isPublished: true,
      isNonPublic: false, // ✅ Filtered
      startDate: { gte: new Date() },
    },
    orderBy: { startDate: 'asc' },
  });
}
```

**Usage:** "Next Course" widget  
**API Route:** `/api/courses/next`  
**Protection:** ✅ Complete

---

### 9. Course Detail by ID (Public API)

**File:** `lib/api/courses.ts`

```typescript
export async function getCourseById(id: string): Promise<Course> {
  const courseRecord = await prisma.course.findUnique({ where: { id } });
  
  // ✅ Throws error if non-public
  if (!courseRecord || !courseRecord.isPublished || courseRecord.isNonPublic) {
    throw new CourseNotFoundError(id);
  }
  
  return { /* ... */ };
}
```

**Usage:** Course detail pages  
**API Route:** `/api/courses/[id]`  
**Protection:** ✅ Error thrown (404)

---

### 10. Course Detail by Slug (Public API)

**File:** `lib/api/courses.ts`

```typescript
export async function getCourseBySlug(slug: string): Promise<Course> {
  const courseRecord = await prisma.course.findUnique({ where: { slug } });
  
  if (!courseRecord) {
    throw new CourseNotFoundError(`slug:${slug}`);
  }
  
  // ✅ Throws error if non-public
  if (!courseRecord.isPublished || courseRecord.isNonPublic) {
    throw new CourseNotPublishedError(courseRecord.id);
  }
  
  return { /* ... */ };
}
```

**Usage:** SEO-friendly course URLs  
**API Route:** `/api/courses/[id]` (slug fallback)  
**Protection:** ✅ Error thrown (404)

---

### 11. Published Courses (Main Listing)

**File:** `lib/api/courses.ts`

```typescript
export async function getPublishedCourses(): Promise<Course[]> {
  const allCourses = await prisma.course.findMany({ /* ... */ });
  
  // ✅ Filter after fetch
  const courses = allCourses.filter(
    course => course.isPublished && !course.isNonPublic
  );
  
  return courses;
}
```

**Usage:** `/courses` page  
**Protection:** ✅ Complete

---

## ✅ Protected SEO & Metadata

### 12. Schema.org Structured Data

**File:** `lib/seo/schemas.ts`

```typescript
export const SCHEMA_COMBINATIONS = {
  courseList: (courses: Array<{ /* ... */ }> = []) => [
    // ...
    ...courses.map(course => generateCourseSchema(course)),
  ],
};
```

**Data Source:** `getPublishedCourses()` from `lib/api/courses.ts`  
**Protection:** ✅ Inherited from filtered source

**Verification:**

```tsx
// app/courses/page.tsx
const dbCourses = await getPublishedCourses(); // ✅ Already filtered
schemaCourses.push(...dbCourses.map(/* ... */));
```

---

### 13. Robots.txt / Sitemap

**File:** `app/robots.ts`

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...SITEMAP_CONFIG.exclude], // Excludes /admin/*, /dashboard/*, etc.
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

**Note:** No dynamic sitemap generation currently exists. All course pages are discoverable via `/courses` listing, which uses filtered data.

**Protection:** ✅ No direct exposure via sitemap  
**Indirect Protection:** ✅ `/courses` page only shows filtered courses

---

## ✅ Course Statistics

### 14. Course Stats (Internal/Admin)

**File:** `lib/api/courses.ts`

```typescript
export async function getCourseStats() {
  const [total, published, unpublished, nonPublic] = await Promise.all([
    prisma.course.count(),
    prisma.course.count({ where: { isPublished: true, isNonPublic: false } }), // ✅ Filtered
    prisma.course.count({ where: { isPublished: false } }),
    prisma.course.count({ where: { isNonPublic: true } }), // ✅ Separate counter
  ]);
  
  return { total, published, unpublished, nonPublic };
}
```

**Usage:** Admin dashboard  
**Protection:** ✅ Separate counter for `isNonPublic` courses

---

## ❌ Unprotected Endpoints (Admin Only)

### 15. Get All Courses (Admin)

**File:** `lib/api/courses.ts`

```typescript
export async function getAllCourses(): Promise<Course[]> {
  const courses = await prisma.course.findMany({
    orderBy: { startDate: 'asc' },
  });
  // ⚠️ No isNonPublic filter - INTENTIONAL for admin use
}
```

**Usage:** Admin course management  
**Protection:** ⚠️ **None** (by design)  
**Security:** ✅ Protected by route-level auth in `/api/admin/courses`

---

### 16. Admin Course Endpoints

**File:** `lib/db/admin/courses.ts`

```typescript
export async function getAdminCourses() {
  return prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
  });
  // ⚠️ No isNonPublic filter - INTENTIONAL for admin
}

export async function getAdminCourseById(id: string) {
  return prisma.course.findUnique({ where: { id } });
  // ⚠️ No isNonPublic filter - INTENTIONAL for admin
}
```

**Usage:** Admin CRUD operations  
**Protection:** ⚠️ **None** (by design)  
**Security:** ✅ Protected by route-level auth in `/api/admin/*`

---

## Security Checklist

When adding new public course endpoints:

- [ ] **Query Filter**: Add `isNonPublic: false` to Prisma `where` clause
- [ ] **Post-Fetch Filter**: If using existing functions, verify they already filter
- [ ] **Error Handling**: Throw `CourseNotFoundError` if `isNonPublic === true`
- [ ] **Schema.org**: Ensure structured data uses filtered course source
- [ ] **Sitemap**: If generating dynamic sitemap, use filtered course list
- [ ] **API Routes**: Test with `?id=<nonPublicCourseId>` to verify 404 response
- [ ] **Search**: Ensure search queries include `isNonPublic: false`

---

## Testing Strategy

### Unit Tests

```typescript
describe('getCourses', () => {
  it('should exclude isNonPublic courses by default', async () => {
    await createTestCourse({ isPublished: true, isNonPublic: true });
    const courses = await getCourses();
    expect(courses.every(c => !c.isNonPublic)).toBe(true);
  });
});
```

### E2E Tests

```typescript
test('non-public course should return 404', async ({ page }) => {
  const nonPublicCourse = await createTestCourse({ isNonPublic: true });
  await page.goto(`/courses/${nonPublicCourse.id}`);
  await expect(page.locator('h1')).toContainText('Course Not Found');
});
```

### API Contract Tests

```typescript
describe('GET /api/courses', () => {
  it('should not return isNonPublic courses', async () => {
    await createTestCourse({ isNonPublic: true });
    const response = await fetch('/api/courses');
    const courses = await response.json();
    expect(courses.every((c: any) => !c.isNonPublic)).toBe(true);
  });
});
```

---

## Risk Assessment

| Endpoint | Exposure Risk | Mitigation |
|----------|---------------|------------|
| `/api/courses` | ❌ None | `isNonPublic: false` in query |
| `/api/courses/next` | ❌ None | `isNonPublic: false` in query |
| `/api/courses/[id]` | ❌ None | Throws 404 on `isNonPublic` |
| `/courses` listing | ❌ None | Uses `getPublishedCourses()` with filter |
| `/courses/[id]` detail | ❌ None | Uses `getCourseBySlug()` with check |
| Schema.org JSON-LD | ❌ None | Uses filtered course source |
| Robots.txt | ❌ None | No dynamic sitemap |
| Search functionality | ❌ None | `isNonPublic: false` in query |
| Admin routes | ⚠️ By design | Route-level auth required |

---

## Maintenance Notes

**When to update this document:**

1. Adding new public course endpoints
2. Creating dynamic sitemap generation
3. Adding new search/filter functionality
4. Implementing course recommendation engines
5. Creating public APIs for external integrations

**Review Schedule:** After each new feature that touches course visibility

**Last Reviewed:** 2026-01-27  
**Next Review:** After 022-* feature or Q2 2026
