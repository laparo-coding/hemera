# Service API Quickstart Guide

This guide helps you test and integrate with the Hemera Service API endpoints.

## Overview

The Service API provides secure access to course and participation data for external applications (Aither, Gaia). All endpoints require authentication via Clerk JWT tokens with the `api-client` or `admin` role.

## Prerequisites

- Clerk service user account with `api-client` role
- Valid Clerk JWT token
- Access to Hemera API (local or production)

## Authentication

### Service User Setup

Service users are created in the Clerk Dashboard with the following metadata:

```json
{
  "role": "api-client",
  "service": "aither"  // or "gaia"
}
```

### Obtaining a JWT Token

For local testing, you can use the Clerk Dashboard to generate a session token:

1. Log into Clerk Dashboard
2. Navigate to Users → Select service user
3. Go to "Sessions" tab
4. Copy the JWT token

For production, use Clerk's SDK to authenticate programmatically:

```typescript
import { clerkClient } from '@clerk/clerk-sdk-node';

// Authenticate as service user
const token = await clerkClient.sessions.getToken(sessionId, 'hemera-api');
```

## API Endpoints

### Base URL

- **Local**: `http://localhost:3000/api/service`
- **Production**: `https://hemera-academy.com/api/service`

### 1. List Courses

**Endpoint**: `GET /api/service/courses`

**Query Parameters**:
- `level` (optional): Filter by course level (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`)
- `published` (optional): Filter by published status (default: `true`)
- `limit` (optional): Max results (default: 100, max: 500)
- `offset` (optional): Pagination offset (default: 0)

**Example Request**:

```bash
curl -X GET "http://localhost:3000/api/service/courses?level=ADVANCED&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Example Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "course_123",
      "title": "Advanced Leadership",
      "slug": "advanced-leadership",
      "level": "ADVANCED",
      "startDate": "2026-03-15T09:00:00Z",
      "endDate": "2026-03-17T17:00:00Z",
      "participantCount": 12
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

### 2. Get Course Details

**Endpoint**: `GET /api/service/courses/{id}`

**Example Request**:

```bash
curl -X GET "http://localhost:3000/api/service/courses/course_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Example Response**:

```json
{
  "success": true,
  "data": {
    "id": "course_123",
    "title": "Advanced Leadership",
    "slug": "advanced-leadership",
    "level": "ADVANCED",
    "startDate": "2026-03-15T09:00:00Z",
    "endDate": "2026-03-17T17:00:00Z",
    "participations": [
      {
        "id": "participation_456",
        "userId": "user_789",
        "status": "PREPARATION",
        "createdAt": "2026-02-01T10:00:00Z"
      }
    ]
  }
}
```

### 3. Get Participation Details

**Endpoint**: `GET /api/service/participations/{id}`

**Example Request**:

```bash
curl -X GET "http://localhost:3000/api/service/participations/participation_456" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Example Response**:

```json
{
  "success": true,
  "data": {
    "id": "participation_456",
    "userId": "user_789",
    "courseId": "course_123",
    "status": "RESULT",
    "preparationIntent": "Improve leadership skills",
    "desiredResults": "Lead a team of 10+ people",
    "resultOutcome": "Successfully completed all objectives",
    "resultNotes": "Excellent performance in group exercises",
    "resultCompletedAt": "2026-03-20T14:30:00Z",
    "createdAt": "2026-02-01T10:00:00Z",
    "updatedAt": "2026-03-20T14:30:00Z"
  }
}
```

### 4. Update Participation Result

**Endpoint**: `PUT /api/service/participations/{id}/result`

**Request Body**:

```json
{
  "resultOutcome": "Successfully completed all objectives",
  "resultNotes": "Excellent performance in group exercises",
  "complete": true
}
```

**Example Request**:

```bash
curl -X PUT "http://localhost:3000/api/service/participations/participation_456/result" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resultOutcome": "Successfully completed all objectives",
    "resultNotes": "Excellent performance in group exercises",
    "complete": true
  }'
```

**Example Response**:

```json
{
  "success": true,
  "message": "Participation result updated successfully"
}
```

## Rate Limiting

All service endpoints are rate-limited:

- **api-client**: 100 requests per minute
- **admin**: 500 requests per minute

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 45
```

When the rate limit is exceeded, you'll receive a `429 Too Many Requests` response:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```

## Error Handling

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 403 | `FORBIDDEN` | Insufficient permissions (not api-client or admin) |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Course not found"
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-14T12:00:00Z"
  }
}
```

## Testing with Postman

1. Import the Hemera API collection from `docs/api/hemera.postman.json`
2. Set up environment variables:
   - `BASE_URL`: `http://localhost:3000` or production URL
   - `JWT_TOKEN`: Your service user JWT token
3. Run the "Service API" folder to test all endpoints

## Integration Example (TypeScript)

```typescript
import { clerkClient } from '@clerk/clerk-sdk-node';

class HemeraServiceClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getCourses(filters?: {
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    published?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.level) params.append('level', filters.level);
    if (filters?.published !== undefined) params.append('published', String(filters.published));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const response = await fetch(
      `${this.baseUrl}/api/service/courses?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async updateParticipationResult(
    participationId: string,
    data: {
      resultOutcome?: string;
      resultNotes?: string;
      complete?: boolean;
    }
  ) {
    const response = await fetch(
      `${this.baseUrl}/api/service/participations/${participationId}/result`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }
}

// Usage
const client = new HemeraServiceClient(
  'https://hemera-academy.com',
  process.env.HEMERA_JWT_TOKEN!
);

const courses = await client.getCourses({ level: 'ADVANCED', limit: 10 });
console.log('Courses:', courses);
```

## Troubleshooting

### Issue: 401 Unauthorized

**Cause**: Missing or invalid JWT token

**Solution**:
1. Verify your JWT token is valid and not expired
2. Ensure the token is included in the `Authorization` header
3. Check that the service user exists in Clerk

### Issue: 403 Forbidden

**Cause**: User role is not `api-client` or `admin`

**Solution**:
1. Verify the service user's `publicMetadata.role` is set to `"api-client"`
2. Check Clerk Dashboard → Users → [Service User] → Metadata

### Issue: 429 Rate Limited

**Cause**: Too many requests in a short time

**Solution**:
1. Implement exponential backoff in your client
2. Check `X-RateLimit-Reset` header for retry time
3. Consider batching requests if possible

### Issue: 404 Not Found

**Cause**: Resource (course/participation) doesn't exist

**Solution**:
1. Verify the ID is correct
2. Check if the resource was deleted
3. Ensure you're using the correct environment (local vs production)

## Support

For issues or questions:
- Check the [API Documentation](../docs/api/openapi.yaml)
- Review [Spec 025](./spec.md) for detailed requirements
- Contact the Hemera development team

## Next Steps

- Review the [OpenAPI Specification](../../docs/api/openapi.yaml) for complete API documentation
- Set up monitoring and error tracking for your integration
- Implement retry logic with exponential backoff
- Test rate limiting behavior under load
