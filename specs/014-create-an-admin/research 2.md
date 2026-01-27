# Phase 0: Research & Technical Decisions

**Feature**: Course Admin Interface  
**Date**: 2025-12-15

## Research Questions

### 1. Next.js Data Mutation Pattern (Server Actions vs API Routes)

**Decision**: Use Server Actions for course mutations with API routes as fallback

**Rationale**:
- Next.js 15 recommends Server Actions for form submissions and mutations
- Server Actions provide automatic serialization and client-side progressive enhancement
- Better integration with React 19 useFormState and useFormStatus hooks
- Simplified error handling with direct server-side validation
- API routes still needed for external integrations or non-form operations

**Alternatives Considered**:
- Pure API Routes: More traditional but requires additional client-side fetch logic
- tRPC: Overkill for simple CRUD operations, adds complexity
- GraphQL: Not aligned with current tech stack, excessive for admin-only feature

**Implementation Approach**:
- Create `lib/actions/admin/courses.ts` with server action functions
- Export async functions marked with 'use server' directive
- Use `revalidatePath()` to update course list after mutations
- API routes in `app/api/admin/courses/` for GET operations and external access

### 2. File Upload Strategy for Course Thumbnails

**Decision**: Vercel Blob Storage with direct upload from client

**Rationale**:
- Vercel Blob integrates seamlessly with Next.js deployment
- Client-side direct upload reduces server load and latency
- Built-in CDN distribution for fast image delivery
- Simple API with `@vercel/blob` package
- Constitutional 10MB file size limit enforceable

**Alternatives Considered**:
- Cloudinary: Additional service dependency, costs
- AWS S3: More configuration, separate infrastructure
- Database BLOB storage: Poor performance for binary data
- Local filesystem: Not compatible with serverless Vercel deployment

**Implementation Approach**:
- Use `@vercel/blob` client library for upload
- Generate unique filenames with UUID prefix
- Validate file type (image/jpeg, image/png, image/webp) and size (<10MB) client-side
- Store blob URL in course.thumbnailUrl field
- Implement cleanup for orphaned blobs when course deleted

### 3. Clerk Admin Role Implementation

**Decision**: Use Clerk organizat metadata for admin role assignment

**Rationale**:
- Clerk supports role-based access control via user metadata
- `publicMetadata.role` accessible in middleware and components
- Can be managed via Clerk Dashboard for initial setup
- Middleware protection pattern already established in codebase

**Alternatives Considered**:
- Database admin flag: Requires duplicate auth state management
- Hardcoded email whitelist: Inflexible, requires code changes
- Separate admin auth system: Violates single authentication principle

**Implementation Approach**:
- Add middleware check for `user.publicMetadata.role === 'admin'`
- Create `/app/admin/layout.tsx` with `<ClerkProvider>` wrapper
- Redirect non-admin users to `/dashboard` with error message
- Document admin role assignment process in README

### 4. Student Transfer Mechanism for Course Deletion

**Decision**: Manual admin-initiated batch transfer with confirmation UI

**Rationale**:
- Business requirement: Admin must explicitly handle enrolled students
- Prevents accidental data loss and maintains student experience continuity
- Allows admin to choose appropriate target course per student cohort
- Constitutional error handling: Block deletion with clear recovery guidance

**Alternatives Considered**:
- Automatic transfer to newest course: May not match student expectations
- Email notification only: Does not prevent deletion, poor UX
- Soft delete with grace period: Complexity without clear value

**Implementation Approach**:
- Check `Enrollment.count({ where: { courseId } })` before deletion
- If enrollments exist, display modal with:
  - List of enrolled students
  - Dropdown to select target course
  - "Transfer All" button to batch update enrollments
- Only enable "Delete Course" button after enrollments = 0
- Log transfer actions to Rollbar for audit trail

### 5. Course Listing Sort Implementation

**Decision**: Database-level ORDER BY with Prisma orderBy clause

**Rationale**:
- Specification requires: "courses with nearest start time first"
- Database sorting more efficient than JavaScript array manipulation
- Prisma `orderBy: { startTime: 'asc' }` provides type-safe query
- Supports pagination in future iterations without refactoring

**Alternatives Considered**:
- Client-side JavaScript sort: Poor performance for large course lists
- Multiple indexes: Premature optimization, single index on startTime sufficient

**Implementation Approach**:
- Prisma query: `prisma.course.findMany({ orderBy: { startTime: 'asc' } })`
- Add database index on `startTime` column in migration
- Cache results with Next.js `revalidateTag('courses')` strategy

### 6. Form Validation Strategy

**Decision**: Zod schema validation with React Hook Form integration

**Rationale**:
- Zod already used in codebase for API validation
- Type-safe validation aligned with TypeScript strict mode
- React Hook Form provides excellent UX with real-time validation
- Server-side validation reuses same Zod schemas
- Constitutional requirement: validate all required fields before save

**Alternatives Considered**:
- Native HTML5 validation: Insufficient for complex business rules
- Manual validation: Error-prone, not type-safe
- Yup: Similar to Zod but less TypeScript-centric

**Implementation Approach**:
- Create `lib/schemas/admin/course.ts` with Zod schema
- Required fields: title, description, price, startTime, duration, instructor, level, thumbnailUrl, capacity
- Validation rules:
  - title: 3-200 characters
  - price: positive number
  - startTime: future date
  - duration: positive integer (hours)
  - capacity: positive integer (students)
  - thumbnailUrl: valid URL from Vercel Blob
- Use `zodResolver` in React Hook Form
- Server action validates with same schema before database write

### 7. Concurrent Edit Handling

**Decision**: Optimistic locking with `updatedAt` timestamp comparison

**Rationale**:
- Prevents lost updates when two admins edit simultaneously
- Simple implementation with Prisma `update({ where: { id, updatedAt } })`
- User-friendly error message: "Course was updated by another admin, please refresh"
- Constitutional error handling requirement

**Alternatives Considered**:
- Pessimistic locking: Complex in serverless environment
- No conflict detection: Data loss risk
- WebSocket real-time updates: Overkill for admin-only feature

**Implementation Approach**:
- Include `updatedAt` in edit form as hidden field
- Server action compares current DB `updatedAt` with form value
- If mismatch, return error and latest course data
- Client displays error with "Refresh" button to reload latest version

### 8. Error Monitoring Integration

**Decision**: Rollbar structured logging with contextual metadata

**Rationale**:
- Constitutional requirement: Rollbar for all error scenarios
- Admin operations are critical business functions requiring monitoring
- Structured context enables debugging: { adminId, courseId, operation }

**Implementation Approach**:
- Import `serverInstance` from `@/lib/monitoring/rollbar-official`
- Log all errors with severity levels:
  - `critical`: File upload service unavailable
  - `error`: Course creation/update failure, concurrent edit conflict
  - `warning`: Deletion blocked by enrollments (expected behavior)
  - `info`: Successful admin operations for audit trail
- Include context: `{ userId: clerk.userId, courseId, action, timestamp, errorDetails }`
- No console.error statements per constitutional mandate

## Technology Stack Summary

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Next.js | 15.5.6 | App Router, Server Actions |
| Language | TypeScript | 5+ | Type safety |
| UI Library | Material-UI | 5+ | Admin interface components |
| Auth | Clerk | Latest | Admin role verification |
| Database | PostgreSQL + Prisma | Latest | Course data persistence |
| File Storage | Vercel Blob | Latest | Thumbnail uploads |
| Form Library | React Hook Form | Latest | Form state management |
| Validation | Zod | Latest | Schema validation |
| Error Monitoring | Rollbar | Latest | Structured error logging |
| Testing | Playwright + Jest | Latest | E2E and unit tests |

## Best Practices Applied

1. **Server-First Architecture**: Mutations via Server Actions, data fetching server-side
2. **Progressive Enhancement**: Forms work without JavaScript (Server Actions fallback)
3. **Type Safety**: Zod schemas generate TypeScript types, Prisma provides DB types
4. **Error Boundaries**: Material-UI Snackbar for user-facing errors, Rollbar for monitoring
5. **Accessibility**: WCAG 2.1 AA compliance with MUI built-in a11y features
6. **Performance**: Database-level sorting, Next.js caching, CDN image delivery
7. **Security**: Clerk middleware, CSRF protection, file upload validation
8. **Testability**: Contract-first API design, mocked Clerk in tests

## Open Questions Resolved

All "NEEDS CLARIFICATION" from Technical Context have been resolved:
- ✅ Data mutation pattern: Server Actions
- ✅ File upload: Vercel Blob
- ✅ Admin auth: Clerk role metadata
- ✅ Student transfer: Manual batch transfer UI
- ✅ Sort order: Database ORDER BY startTime ASC
- ✅ Validation: Zod + React Hook Form
- ✅ Concurrent edits: Optimistic locking with updatedAt
- ✅ Error monitoring: Rollbar with structured context

## Next Steps

Proceed to Phase 1: Design & Contracts
- Create data model with Prisma schema updates
- Generate API contracts for admin endpoints
- Define test scenarios based on user stories
- Create quickstart.md for feature validation
