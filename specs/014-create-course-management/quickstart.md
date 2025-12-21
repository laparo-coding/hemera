# Quickstart: Course Admin Interface

**Feature**: Course Admin Interface  
**Date**: 2025-12-15  
**Estimated Time**: 10 minutes

## Prerequisites

- [ ] Local development environment running (`npm run dev`)
- [ ] PostgreSQL database accessible with latest migrations applied
- [ ] Clerk authentication configured with test account
- [ ] Test account has admin role assigned in Clerk Dashboard:
  - Navigate to Clerk Dashboard → Users → [Your Test User]
  - Metadata → Public Metadata → Add: `{ "role": "admin" }`
- [ ] Vercel Blob storage configured (BLOB_READ_WRITE_TOKEN in .env.local)

## Test Scenario: Complete Admin Workflow

This quickstart validates all core admin operations in sequence.

### 1. Access Admin Interface

**Action**:
1. Sign in to the application with your test admin account
2. Navigate to `/admin` in your browser
3. Verify you see the admin course list page

**Expected Result**:
- ✅ Admin page loads successfully
- ✅ Header displays "Course Management" or similar
- ✅ Course list is visible (may be empty initially)
- ✅ "Create New Course" button is present

**Failure Indicators**:
- ❌ Redirect to `/dashboard` or `/sign-in` → Check Clerk admin role assignment
- ❌ 403 Forbidden error → Verify middleware checks `publicMetadata.role`
- ❌ Page crashes → Check browser console and Rollbar for React errors

---

### 2. Create New Course

**Action**:
1. Click "Create New Course" button
2. Fill in the form with test data:
   - **Title**: "Quickstart Test Course"
   - **Description**: "This is a test course created during quickstart validation"
   - **Price**: 99.00
   - **Start Time**: Select a date 7 days in the future
   - **Duration**: 4 (hours)
   - **Instructor**: "Test Instructor"
   - **Level**: Select "BEGINNER"
   - **Capacity**: 10
   - **Thumbnail**: Upload a small test image (<1MB, .png or .jpg)
3. Click "Save Course" or "Create Course"

**Expected Result**:
- ✅ Form validates successfully (no error messages)
- ✅ File upload shows progress indicator
- ✅ Success message appears: "Course created successfully"
- ✅ Redirect to course list page
- ✅ New course appears in the list, sorted by start time
- ✅ Thumbnail image displays correctly

**Failure Indicators**:
- ❌ Validation errors for required fields → Check Zod schema
- ❌ File upload fails → Verify Vercel Blob token and size limits
- ❌ Course not visible in list → Check Prisma query and revalidation
- ❌ 500 error → Check Rollbar logs for server-side errors

---

### 3. View Course Details

**Action**:
1. From the course list, click on "Quickstart Test Course"
2. Verify all fields display correctly

**Expected Result**:
- ✅ Course detail view loads
- ✅ All fields match what you entered
- ✅ Enrollment count shows "0 / 10" (0 students enrolled, capacity 10)
- ✅ "Edit" and "Delete" buttons are visible

**Failure Indicators**:
- ❌ 404 Not Found → Check route parameter handling
- ❌ Missing data → Verify Prisma `include` clause for enrollment count

---

### 4. Edit Course

**Action**:
1. Click "Edit" button
2. Modify the following fields:
   - **Title**: "Quickstart Test Course (Edited)"
   - **Price**: 149.00
   - **Capacity**: 15
3. Click "Save Changes"

**Expected Result**:
- ✅ Form pre-populates with existing course data
- ✅ Changes save successfully
- ✅ Success message: "Course updated successfully"
- ✅ Updated values visible in course detail view
- ✅ `updatedAt` timestamp is more recent

**Failure Indicators**:
- ❌ 409 Conflict (concurrent edit) → Should not occur in single-user test; check optimistic locking logic
- ❌ Validation error on capacity → If you set capacity < 0 or non-integer
- ❌ Changes not persisted → Check Prisma `update` operation

---

### 5. Test Deletion Protection

**Action**:
1. Navigate back to course detail view
2. Click "Delete" button
3. **Do NOT confirm yet** - observe the UI

**Expected Result**:
- ✅ Delete confirmation modal appears
- ✅ Modal shows: "0 students enrolled" or "This course has no enrollments"
- ✅ "Confirm Delete" button is enabled (since enrollment count = 0)

**Simulating Enrollment Protection** (Optional Advanced Test):
1. Open Prisma Studio or database client
2. Manually create an enrollment record:
   ```sql
   INSERT INTO "Enrollment" (id, "userId", "courseId", status, "enrolledAt")
   VALUES (gen_random_uuid(), 'test_user_id', '<your_course_id>', 'ACTIVE', NOW());
   ```
3. Refresh the delete modal
4. **Expected**: "Confirm Delete" button is now **disabled**
5. Message displays: "Cannot delete: 1 student enrolled. Transfer students first."

**Failure Indicators**:
- ❌ Delete proceeds without confirmation → Missing modal component
- ❌ Enrollment check not working → Verify Prisma enrollment count query
- ❌ No "Transfer Students" UI → Implement transfer feature or document as future work

---

### 6. Delete Course

**Action**:
1. Ensure enrollment count is 0 (delete any test enrollments)
2. Click "Delete" button
3. Confirm deletion in the modal

**Expected Result**:
- ✅ Course is removed from the list
- ✅ Success message: "Course deleted successfully"
- ✅ Redirect to course list page
- ✅ Course no longer appears in the list
- ✅ Thumbnail image is cleaned up from Vercel Blob (check blob dashboard)

**Failure Indicators**:
- ❌ Course still visible in list → Check Prisma delete operation and revalidation
- ❌ 500 error → Check Rollbar for delete operation errors
- ❌ Orphaned thumbnail in blob storage → Verify cleanup logic in delete action

---

### 7. Verify Sorting

**Action**:
1. Create 2 more courses with different start times:
   - **Course A**: Start time = 5 days from now
   - **Course B**: Start time = 15 days from now
   - **Course C**: Start time = 10 days from now
2. Return to course list

**Expected Result**:
- ✅ Courses are ordered as: Course A, Course C, Course B (nearest start time first)
- ✅ List updates dynamically without manual refresh

**Failure Indicators**:
- ❌ Incorrect sort order → Verify `orderBy: { startTime: 'asc' }` in Prisma query
- ❌ Courses not sorted → Check if index on `startTime` exists

---

### 8. Test Error Handling

**Action**:
1. Attempt to create a course with **invalid data**:
   - Leave "Title" empty
   - Set "Price" to -50
   - Set "Capacity" to 0
2. Click "Save Course"

**Expected Result**:
- ✅ Form validation blocks submission
- ✅ Error messages appear below each invalid field:
  - Title: "Title is required"
  - Price: "Price must be non-negative"
  - Capacity: "Capacity must be at least 1"
- ✅ No network request is made (client-side validation)

**Failure Indicators**:
- ❌ Form submits anyway → React Hook Form validation not configured
- ❌ Generic error message → Zod schema validation not wired to UI
- ❌ 400 error from server → Server-side validation working, but client validation bypassed

---

### 9. Test Concurrent Edit Protection

**Action** (requires two browser windows):
1. Open the same course edit page in **two separate browser tabs**
2. In **Tab 1**: Change title to "Version 1" and save
3. In **Tab 2**: Change title to "Version 2" and save (without refreshing)

**Expected Result**:
- ✅ **Tab 1** saves successfully
- ✅ **Tab 2** displays error: "Course was modified by another admin. Please refresh."
- ✅ Error message includes "Latest update timestamp" or similar context
- ✅ No data loss (only one version is saved)

**Failure Indicators**:
- ❌ Both saves succeed → Optimistic locking not implemented
- ❌ Tab 2 overwrites Tab 1 → Lost update problem (critical bug)
- ❌ No error message → Missing conflict detection logic

---

### 10. Verify Rollbar Logging

**Action**:
1. Open Rollbar dashboard (https://rollbar.com/)
2. Navigate to the Hemera project
3. Filter events by timeframe: Last 15 minutes

**Expected Result**:
- ✅ **Info level**: Course creation, update, deletion events logged with context:
  - `{ adminId: "user_xyz", courseId: "clx123", action: "create", timestamp: "..." }`
- ✅ **Warning level**: Deletion blocked by enrollments (if tested)
- ✅ **Error level**: Any validation or server errors encountered during testing

**Failure Indicators**:
- ❌ No events logged → Verify Rollbar integration and `serverInstance.error()` calls
- ❌ console.error logs instead → Constitutional violation (must use Rollbar)
- ❌ Missing context data → Check structured logging implementation

---

## Cleanup

**Action**:
1. Delete all test courses created during quickstart
2. Verify Vercel Blob storage shows no orphaned images
3. Remove test enrollment records (if created)

**Expected Result**:
- ✅ Database returns to clean state
- ✅ No residual test data visible in UI

---

## Quickstart Completion Checklist

- [ ] Admin interface accessible with Clerk admin role
- [ ] Course creation works with file upload
- [ ] Course listing displays sorted by start time
- [ ] Course editing saves changes successfully
- [ ] Deletion protection blocks removal with active enrollments
- [ ] Course deletion works when no enrollments exist
- [ ] Form validation prevents invalid data submission
- [ ] Concurrent edit detection works (optimistic locking)
- [ ] Rollbar logs all admin operations with structured context
- [ ] All test courses and data cleaned up

---

## Troubleshooting

### Issue: Cannot access /admin route
- **Check**: Clerk admin role assigned in Dashboard
- **Verify**: Middleware configuration in `middleware.ts`
- **Logs**: Check Rollbar for auth-related errors

### Issue: File upload fails
- **Check**: `BLOB_READ_WRITE_TOKEN` in `.env.local`
- **Verify**: File size <10MB and type is image/png or image/jpeg
- **Logs**: Check Rollbar for Vercel Blob errors

### Issue: Course not appearing in list
- **Check**: Database migration applied (`npm run prisma:migrate`)
- **Verify**: `revalidatePath('/admin')` called after creation
- **Logs**: Check Prisma query logs and Rollbar for DB errors

### Issue: Optimistic locking not working
- **Check**: `updatedAt` field included in edit form hidden input
- **Verify**: Server action compares `updatedAt` before update
- **Logs**: Check for 409 Conflict responses in network tab

---

**Next Steps**: If all checks pass, proceed to Phase 2 task generation with `/tasks` command.
