# Validation Guide: Course Admin Interface

This guide describes how to validate the complete implementation of the Course Admin Interface feature (spec 014-create-an-admin).

## Overview

Three automated validation scripts have been created to verify:
1. **Rollbar Integration** - Structured logging at all levels
2. **Performance** - API endpoints and page load times
3. **Quickstart Compliance** - Feature completeness

## Prerequisites

Before running validation scripts:
- Development server running: `npm run dev`
- Database running and migrated: `npm run prisma:migrate`
- Environment variables configured in `.env.local`
- Admin user created with Clerk role

## Validation Scripts

### 1. Rollbar Verification

**Script:** `scripts/verify-rollbar-admin.js`

**Purpose:** Validates that Rollbar logging is configured and working correctly.

**Usage:**
```bash
node scripts/verify-rollbar-admin.js
```

**What it checks:**
- ✅ Rollbar access token configured
- ✅ INFO level logging (course CRUD operations)
- ✅ WARNING level logging (deletion blocked)
- ✅ ERROR level logging (validation failures)
- ✅ CRITICAL level logging (server errors)

**Expected output:**
```
🔍 Verifying Rollbar Integration for Course Admin Interface...

✅ Rollbar access token configured

📝 Testing Rollbar log levels...
  ✅ INFO level logged (course creation)
  ✅ WARNING level logged (deletion blocked)
  ✅ ERROR level logged (validation failure)
  ✅ CRITICAL level logged (database failure)

⏳ Waiting for events to be sent to Rollbar...

✅ Rollbar logging test complete!
```

**Manual verification:**
1. Visit https://rollbar.com/
2. Navigate to your project
3. Filter by "last 5 minutes"
4. Look for events with `feature: "course-admin"`
5. Verify all 4 test events are present

**Structured context should include:**
- `feature`: 'course-admin'
- `action`: create|update|delete|validate|delete-blocked
- `adminId`: Clerk user ID
- `courseId`: Course ID (when applicable)
- `timestamp`: ISO 8601 timestamp

---

### 2. Performance Verification

**Script:** `scripts/verify-performance-admin.js`

**Purpose:** Measures API endpoint and page load performance.

**Usage:**
```bash
# Start dev server first
npm run dev

# In another terminal:
node scripts/verify-performance-admin.js
```

**What it measures:**
- ✅ LIST /api/admin/courses (target: <100ms average)
- ✅ GET /api/admin/courses/[id] (target: <50ms average)
- ✅ Admin page load /admin/courses (target: <2000ms)

**Expected output:**
```
⚡ Performance Verification for Course Admin Interface

Testing against: http://localhost:3000

📊 Testing: LIST Courses API
   URL: http://localhost:3000/api/admin/courses
   Target: <100ms

   Iteration 10/10: 45.23ms

   Results (10 successful requests):
   - Average: 43.56ms
   - Median:  42.10ms
   - Min:     38.45ms
   - Max:     52.33ms

   ✅ PASSED (avg 43.56ms vs target 100ms)
```

**Performance targets:**
- **LIST endpoint**: <100ms (quickstart requirement)
- **GET endpoint**: <50ms (efficient single record fetch)
- **Page load**: <2s (quickstart requirement)

**If targets not met:**
- Add database indexes (e.g., on `startTime`)
- Enable query caching
- Optimize Prisma queries (use `select` to limit fields)
- Consider Next.js ISR (Incremental Static Regeneration)

---

### 3. Quickstart Validation

**Script:** `scripts/validate-quickstart-admin.js`

**Purpose:** Automated validation of feature completeness per quickstart checklist.

**Usage:**
```bash
node scripts/validate-quickstart-admin.js
```

**What it checks:**
- ✅ Environment variables configured
- ✅ Database schema has all required fields
- ✅ CourseLevel enum exists
- ✅ Database index on startTime
- ✅ All required files exist (schemas, actions, API routes, pages, components)
- ✅ Test files exist (contract tests, E2E tests)
- ✅ Database CRUD operations work

**Expected output:**
```
✅ Quickstart Validation for Course Admin Interface

📋 Checking Environment Variables...
   ✅ DATABASE_URL configured
   ✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY configured
   ✅ CLERK_SECRET_KEY configured
   ✅ BLOB_READ_WRITE_TOKEN configured
   ✅ ROLLBAR_ACCESS_TOKEN configured

📋 Checking Database Schema...
   ✅ Course.id exists
   ✅ Course.title exists
   ...

📊 Validation Summary
   ✅ Passed: 45
   ❌ Failed: 0
   ⚠️  Warnings: 1

✅ All validation checks passed!
```

**Manual quickstart testing:**
After automated validation passes, follow manual steps in:
`specs/014-create-an-admin/quickstart.md`

---

## Complete Validation Checklist

Use this checklist to verify the feature is ready for production:

### Automated Checks
- [ ] Run `node scripts/verify-rollbar-admin.js` - all levels log correctly
- [ ] Run `node scripts/verify-performance-admin.js` - all targets met
- [ ] Run `node scripts/validate-quickstart-admin.js` - all checks pass

### Manual Testing (from quickstart.md)
- [ ] Step 1: Access admin interface (/admin)
- [ ] Step 2: Create new course with all fields
- [ ] Step 3: View course details
- [ ] Step 4: Edit course and verify changes
- [ ] Step 5: Test deletion protection with enrollments
- [ ] Step 6: Delete empty course
- [ ] Step 7: Verify sorting by startTime ascending
- [ ] Step 8: Test client-side validation (empty fields, invalid data)
- [ ] Step 9: Test concurrent edit protection (two tabs)
- [ ] Step 10: Verify Rollbar logging in production dashboard

### Code Quality
- [ ] Run `npm run typecheck` - no TypeScript errors
- [ ] Run `npm run lint` - no ESLint errors
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run test:e2e` - all E2E tests pass

### Security
- [ ] Admin routes protected by Clerk authentication
- [ ] Role check: `user.publicMetadata?.role === 'admin'`
- [ ] File upload validated (type, size)
- [ ] SQL injection protection (Prisma ORM)
- [ ] XSS protection (React escaping)

### Documentation
- [ ] README updated with admin interface instructions
- [ ] API routes documented in `docs/api/`
- [ ] Quickstart guide complete and tested
- [ ] Troubleshooting section covers common issues

---

## Troubleshooting

### Rollbar script fails

**Error:** `ROLLBAR_ACCESS_TOKEN not found`
- Add token to `.env.local`
- Restart any running processes

**Error:** Events not appearing in Rollbar
- Check Rollbar dashboard filters (time range)
- Verify token has correct permissions
- Check network connectivity

### Performance script fails

**Error:** `Cannot connect to development server`
- Start dev server: `npm run dev`
- Wait for server to be ready
- Verify port 3000 is not blocked

**Performance targets not met:**
- Check database has indexes
- Run `ANALYZE=true npm run build` to check bundle size
- Profile with Chrome DevTools
- Consider caching strategies

### Quickstart validation fails

**Database schema errors:**
- Run migrations: `npm run prisma:migrate`
- Verify `.env.local` DATABASE_URL
- Check PostgreSQL is running

**File not found errors:**
- Verify all tasks (T001-T029) completed
- Check file paths match exactly
- Ensure no typos in filenames

**Database operations fail:**
- Check PostgreSQL connection
- Verify Prisma schema matches database
- Run `npx prisma db push` to sync

---

## Success Criteria

The feature is **COMPLETE** when:

1. ✅ All automated validation scripts pass
2. ✅ All manual quickstart steps pass
3. ✅ All tests pass (unit, contract, E2E)
4. ✅ TypeScript compiles with zero errors
5. ✅ Rollbar shows structured logs in production
6. ✅ Performance targets met (<100ms API, <2s page load)
7. ✅ Admin authentication working
8. ✅ File uploads working (thumbnails)
9. ✅ Optimistic locking prevents concurrent edits
10. ✅ Deletion protection blocks when enrollments exist

---

## Next Steps

After validation:

1. **Merge to main:** Create PR with all changes
2. **Deploy to staging:** Test in staging environment
3. **Final QA:** Run manual quickstart on staging
4. **Production deploy:** Deploy to production
5. **Monitor:** Watch Rollbar for errors in first 24h
6. **Document:** Update user documentation with admin guide

---

## Related Documentation

- **Feature Spec:** `specs/014-create-an-admin/feature-plan.md`
- **Implementation Plan:** `specs/014-create-an-admin/implement.prompt.md`
- **Tasks:** `specs/014-create-an-admin/tasks.md`
- **Quickstart:** `specs/014-create-an-admin/quickstart.md`
- **API Contract:** `specs/014-create-an-admin/api-contract.md`
- **Testing Guide:** `docs/tests/README.md`
