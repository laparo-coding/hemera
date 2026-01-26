# API Contract: Admin Course Management

**Feature**: Course Admin Interface  
**Date**: 2025-12-15  
**Base Path**: `/api/admin/courses`

## Authentication

All endpoints require:
- Valid Clerk session token
- User metadata: `publicMetadata.role === 'admin'`

**Response for unauthorized access**:
```json
{
  "error": "Unauthorized",
  "message": "Admin role required",
  "code": "AUTH_INSUFFICIENT_PERMISSIONS"
}
```
**Status**: 403 Forbidden

---

## Endpoints

### 1. List Courses

**GET** `/api/admin/courses`

Lists all courses sorted by start time (nearest first).

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| published | boolean | No | null | Filter by published status (null = all) |
| limit | number | No | 50 | Max results (future pagination) |

**Request Example**:
```http
GET /api/admin/courses?published=true HTTP/1.1
Authorization: Bearer <clerk_token>
```

**Response Success** (200 OK):
```json
{
  "courses": [
    {
      "id": "clx123abc456",
      "title": "Gehaltsverhandlung Grundkurs",
      "description": "Lernen Sie die Grundlagen...",
      "price": "299.00",
      "startTime": "2025-02-15T10:00:00Z",
      "duration": 8,
      "instructor": "Dr. Maria Schmidt",
      "level": "BEGINNER",
      "thumbnailUrl": "https://blob.vercel-storage.com/abc123.png",
      "capacity": 20,
      "published": true,
      "enrollmentCount": 12,
      "createdAt": "2025-01-10T14:30:00Z",
      "updatedAt": "2025-01-12T09:15:00Z"
    }
  ],
  "total": 1
}
```

**Response Error** (500 Internal Server Error):
```json
{
  "error": "Database Error",
  "message": "Failed to fetch courses",
  "code": "DB_QUERY_FAILED"
}
```

---

### 2. Get Course by ID

**GET** `/api/admin/courses/[id]`

Retrieves detailed information for a specific course including enrollment count.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Course CUID |

**Request Example**:
```http
GET /api/admin/courses/clx123abc456 HTTP/1.1
Authorization: Bearer <clerk_token>
```

**Response Success** (200 OK):
```json
{
  "id": "clx123abc456",
  "title": "Gehaltsverhandlung Grundkurs",
  "description": "Lernen Sie die Grundlagen der erfolgreichen Gehaltsverhandlung...",
  "price": "299.00",
  "startTime": "2025-02-15T10:00:00Z",
  "duration": 8,
  "instructor": "Dr. Maria Schmidt",
  "level": "BEGINNER",
  "thumbnailUrl": "https://blob.vercel-storage.com/abc123.png",
  "capacity": 20,
  "published": true,
  "enrollmentCount": 12,
  "createdAt": "2025-01-10T14:30:00Z",
  "updatedAt": "2025-01-12T09:15:00Z"
}
```

**Response Error** (404 Not Found):
```json
{
  "error": "Not Found",
  "message": "Course with ID clx123abc456 does not exist",
  "code": "COURSE_NOT_FOUND"
}
```

---

### 3. Create Course

**POST** `/api/admin/courses`

Creates a new course with all required fields.

**Request Body**:
```json
{
  "title": "Gehaltsverhandlung für Fortgeschrittene",
  "description": "Vertiefen Sie Ihre Verhandlungskompetenzen...",
  "price": 499.00,
  "startTime": "2025-03-20T09:00:00Z",
  "duration": 12,
  "instructor": "Prof. Dr. Anna Weber",
  "level": "ADVANCED",
  "thumbnailUrl": "https://blob.vercel-storage.com/xyz789.png",
  "capacity": 15
}
```

**Validation Rules**:
- `title`: 3-200 characters, required
- `description`: Min 10 characters, required
- `price`: >= 0, max 2 decimals, required
- `startTime`: Valid ISO 8601 datetime, required
- `duration`: Positive integer, required
- `instructor`: Min 2 characters, required
- `level`: One of BEGINNER, INTERMEDIATE, ADVANCED, required
- `thumbnailUrl`: Valid Vercel Blob URL, optional
- `capacity`: Positive integer, required

**Response Success** (201 Created):
```json
{
  "id": "clx789xyz123",
  "title": "Gehaltsverhandlung für Fortgeschrittene",
  "description": "Vertiefen Sie Ihre Verhandlungskompetenzen...",
  "price": "499.00",
  "startTime": "2025-03-20T09:00:00Z",
  "duration": 12,
  "instructor": "Prof. Dr. Anna Weber",
  "level": "ADVANCED",
  "thumbnailUrl": "https://blob.vercel-storage.com/xyz789.png",
  "capacity": 15,
  "published": false,
  "enrollmentCount": 0,
  "createdAt": "2025-12-15T10:30:00Z",
  "updatedAt": "2025-12-15T10:30:00Z"
}
```

**Response Error** (400 Bad Request - Validation):
```json
{
  "error": "Validation Error",
  "message": "Invalid course data",
  "code": "VALIDATION_FAILED",
  "details": [
    {
      "field": "title",
      "message": "Title must be between 3 and 200 characters"
    },
    {
      "field": "startTime",
      "message": "Start time must be a future date"
    }
  ]
}
```

**Response Error** (409 Conflict - Duplicate Title Warning):
```json
{
  "error": "Conflict",
  "message": "A course with similar title already exists",
  "code": "DUPLICATE_TITLE_WARNING",
  "existingCourseId": "clx123abc456"
}
```
**Status**: 409 Conflict (non-blocking, admin can proceed)

---

### 4. Update Course

**PATCH** `/api/admin/courses/[id]`

Updates an existing course with optimistic locking.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Course CUID |

**Request Body**:
```json
{
  "updatedAt": "2025-01-12T09:15:00Z",
  "title": "Gehaltsverhandlung Grundkurs (Aktualisiert)",
  "price": 349.00,
  "capacity": 25
}
```

**Notes**:
- `updatedAt` required for optimistic locking (must match current DB value)
- Only provided fields are updated (partial update)
- Cannot update `id`, `createdAt`, or `enrollmentCount`

**Response Success** (200 OK):
```json
{
  "id": "clx123abc456",
  "title": "Gehaltsverhandlung Grundkurs (Aktualisiert)",
  "description": "Lernen Sie die Grundlagen...",
  "price": "349.00",
  "startTime": "2025-02-15T10:00:00Z",
  "duration": 8,
  "instructor": "Dr. Maria Schmidt",
  "level": "BEGINNER",
  "thumbnailUrl": "https://blob.vercel-storage.com/abc123.png",
  "capacity": 25,
  "published": true,
  "enrollmentCount": 12,
  "createdAt": "2025-01-10T14:30:00Z",
  "updatedAt": "2025-12-15T11:00:00Z"
}
```

**Response Error** (409 Conflict - Concurrent Edit):
```json
{
  "error": "Conflict",
  "message": "Course was modified by another admin. Please refresh and try again.",
  "code": "CONCURRENT_EDIT_CONFLICT",
  "latestUpdatedAt": "2025-12-15T10:45:00Z"
}
```

**Response Error** (400 Bad Request - Capacity Constraint):
```json
{
  "error": "Validation Error",
  "message": "Capacity cannot be less than current enrollment count",
  "code": "CAPACITY_BELOW_ENROLLMENTS",
  "currentEnrollmentCount": 12,
  "requestedCapacity": 10
}
```

---

### 5. Delete Course

**DELETE** `/api/admin/courses/[id]`

Deletes a course only if no active enrollments exist.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Course CUID |

**Request Example**:
```http
DELETE /api/admin/courses/clx123abc456 HTTP/1.1
Authorization: Bearer <clerk_token>
```

**Response Success** (204 No Content):
```
(empty body)
```

**Response Error** (409 Conflict - Active Enrollments):
```json
{
  "error": "Conflict",
  "message": "Cannot delete course with active enrollments. Transfer students first.",
  "code": "ACTIVE_ENROLLMENTS_EXIST",
  "enrollmentCount": 12,
  "enrolledStudents": [
    {
      "userId": "user_abc123",
      "name": "Max Mustermann",
      "enrolledAt": "2025-01-15T12:00:00Z"
    }
  ]
}
```
**Status**: 409 Conflict

**Response Error** (404 Not Found):
```json
{
  "error": "Not Found",
  "message": "Course with ID clx123abc456 does not exist",
  "code": "COURSE_NOT_FOUND"
}
```

---

### 6. Transfer Enrollments

**POST** `/api/admin/courses/[id]/transfer-enrollments`

Transfers all active enrollments from one course to another (prerequisite for deletion).

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Source course CUID |

**Request Body**:
```json
{
  "targetCourseId": "clx789xyz123"
}
```

**Validation**:
- `targetCourseId` must be a valid existing course
- Target course must have sufficient capacity (capacity >= current enrollments + transferred enrollments)
- Source and target courses cannot be the same

**Response Success** (200 OK):
```json
{
  "message": "Successfully transferred enrollments",
  "transferredCount": 12,
  "sourceCourseId": "clx123abc456",
  "targetCourseId": "clx789xyz123"
}
```

**Response Error** (400 Bad Request - Insufficient Capacity):
```json
{
  "error": "Validation Error",
  "message": "Target course has insufficient capacity",
  "code": "INSUFFICIENT_CAPACITY",
  "targetCapacity": 15,
  "targetEnrollmentCount": 10,
  "transferCount": 12,
  "availableSlots": 5
}
```

**Response Error** (404 Not Found - Invalid Target):
```json
{
  "error": "Not Found",
  "message": "Target course with ID clx789xyz123 does not exist",
  "code": "TARGET_COURSE_NOT_FOUND"
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_INSUFFICIENT_PERMISSIONS | 403 | User does not have admin role |
| COURSE_NOT_FOUND | 404 | Course ID does not exist |
| VALIDATION_FAILED | 400 | Request body validation errors |
| DUPLICATE_TITLE_WARNING | 409 | Similar course title exists (non-blocking) |
| CONCURRENT_EDIT_CONFLICT | 409 | updatedAt mismatch (optimistic lock) |
| CAPACITY_BELOW_ENROLLMENTS | 400 | Requested capacity < enrollment count |
| ACTIVE_ENROLLMENTS_EXIST | 409 | Cannot delete course with students |
| INSUFFICIENT_CAPACITY | 400 | Target course cannot accommodate transfers |
| TARGET_COURSE_NOT_FOUND | 404 | Transfer target does not exist |
| DB_QUERY_FAILED | 500 | Database operation error |
| BLOB_UPLOAD_FAILED | 500 | Vercel Blob upload error |

---

## Rate Limiting

- **Admin Tier**: 100 requests per minute per admin user
- Exceeding limit returns 429 Too Many Requests

---

## Testing Strategy

### Contract Tests (tests/contract/admin/courses.spec.ts)

1. **Authentication Tests**:
   - ✅ Non-admin user receives 403
   - ✅ Missing Clerk token receives 401
   - ✅ Admin user with valid token receives 200/201

2. **Request/Response Schema Tests**:
   - ✅ List courses returns array matching schema
   - ✅ Create course with valid data returns 201 with full course object
   - ✅ Update course with invalid data returns 400 with validation details
   - ✅ Delete course with enrollments returns 409 with enrollment list

3. **Edge Case Tests**:
   - ✅ Create course with duplicate title returns 409 warning
   - ✅ Update course with stale updatedAt returns 409 conflict
   - ✅ Transfer enrollments with insufficient capacity returns 400

4. **Error Handling Tests**:
   - ✅ All error responses match error code schema
   - ✅ Rollbar logging triggered for 500 errors
   - ✅ User-friendly error messages for all failure scenarios

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-15 | Initial API contract definition |

---

**Next Steps**: Generate contract test files based on these specifications.
