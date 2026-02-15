# API Documentation

This document describes all API endpoints including public, authenticated user, and admin endpoints.

## Quick Reference

### Public Endpoints (No Authentication)

| Endpoint       | Method | Description                  |
| -------------- | ------ | ---------------------------- |
| `/api/courses` | GET    | Browse all published courses |

### Authenticated Endpoints (User Login Required)

| Endpoint        | Method | Description                 |
| --------------- | ------ | --------------------------- |
| `/api/bookings` | GET    | Get user's booked courses   |
| `/api/bookings` | POST   | Create a new course booking |

### Admin Endpoints (Admin Role Required)

| Endpoint               | Method | Description                  |
| ---------------------- | ------ | ---------------------------- |
| `/api/admin/users`     | GET    | User management with stats   |
| `/api/admin/courses`   | GET    | Course management with stats |
| `/api/admin/analytics` | GET    | Analytics and metrics        |
| `/api/admin/errors`    | GET    | Error monitoring and logs    |
| `/api/admin/errors`    | POST   | Error management actions     |

## Overview

The API endpoints are organized by authentication level:

- **Public Endpoints**: Accessible without authentication for browsing public data
- **Authenticated Endpoints**: Require user login for personal data and actions
- **Admin Endpoints**: Require authentication and admin role for management functions

All endpoints use:

- **Standardized Responses**: Consistent JSON format with error codes and request IDs
- **CORS**: Cross-Origin Resource Sharing enabled where appropriate
- **Error Handling**: Comprehensive error responses with Rollbar monitoring

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: Your deployed application URL

**Hinweis:** In allen API-Anfragen und -Antworten wird das Feld `price` als Integer in Cent (EUR) verwendet. Beispiel: `9999` entspricht `€99.99`.

## Authentication

Authentication requirements vary by endpoint type:

**Public Endpoints** (`/api/courses`)

- No authentication required
- Accessible to anyone

**Authenticated Endpoints** (`/api/bookings`)

- Requires a valid Clerk authentication session
- User must be logged in

**Admin Endpoints** (`/api/admin/*`)

- Requires a valid Clerk authentication session
- User must have `admin` role in their `publicMetadata`

### Authentication Methods

**Option 1: Session Cookie (Browser)**

- Sign in to the application
- Session cookie is automatically sent with requests

**Option 2: Authorization Header (External Apps)**

```http
Authorization: Bearer <clerk-session-token>
```

## CORS Configuration

⚠️ **Security Warning**: The current configuration uses wildcard CORS (`*`) for development and
testing purposes. For production environments, you should restrict origins to specific trusted
domains.

**CORS is enabled only on admin endpoints** (`/api/admin/*`) to allow external applications to
access administrative data:

- **Allowed Origins**: `*` (all origins) - **⚠️ Change this in production!**
- **Allowed Methods**: Vary by endpoint (GET, POST, OPTIONS)
- **Allowed Headers**: `Content-Type`, `Authorization`

Preflight requests (OPTIONS) are supported on all admin endpoints.

**Note**: Public and authenticated user endpoints do not have CORS headers as they are intended for
same-origin usage within the web application.

### Production CORS Configuration

For production, update the `corsHeaders` in each admin route file to restrict origins:

```typescript
// Example: Restrict to specific domains
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://trusted-app.example.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Example: Allow multiple trusted domains
const allowedOrigins = ['https://trusted-app-1.example.com', 'https://trusted-app-2.example.com'];

const origin = request.headers.get('origin');
const corsOrigin = allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0];

const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## Public API Endpoints

These endpoints are publicly accessible and do not require authentication.

### Public Courses Listing

**Endpoint**: `GET /api/courses`

**Description**: Retrieve all published courses with filtering, sorting, and pagination options.

**Authentication**: ❌ Not required (public endpoint)

**Query Parameters**:

- `search` (optional): Search term for course title or description
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `availableOnly` (optional): Filter only courses with available spots (boolean)
- `sortBy` (optional): Sort by `title`, `price`, or `date`
- `sortOrder` (optional): Sort order `asc` or `desc`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Example Request**:

```bash
# Get all courses
curl https://your-app.vercel.app/api/courses

# Search and filter courses
curl "https://your-app.vercel.app/api/courses?search=react&minPrice=50&sortBy=price&sortOrder=asc&page=1&limit=20"
```

**Response**:

```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course_123",
        "title": "Introduction to React",
        "description": "Learn React basics",
        "slug": "intro-to-react",
        "price": 9999,
        "currency": "EUR",
        "capacity": 30,
        "date": "2025-02-01T10:00:00.000Z",
        "isPublished": true,
        "availableSpots": 15,
        "totalBookings": 15,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-15T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

## Authenticated User Endpoints

These endpoints require user authentication but do not require admin privileges.

### User's Bookings

**Endpoint**: `GET /api/bookings`

**Description**: Retrieve the authenticated user's course bookings.

**Authentication**: ✅ Required (user must be logged in)

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by payment status (`PENDING`, `PAID`, `FAILED`, `REFUNDED`)

**Example Request**:

```bash
# Get user's bookings (requires authentication cookie or token)
curl -X GET "https://your-app.vercel.app/api/bookings" \
  -H "Cookie: __session=<clerk-session-token>"

# Filter by status
curl -X GET "https://your-app.vercel.app/api/bookings?status=PAID&page=1&limit=10" \
  -H "Cookie: __session=<clerk-session-token>"
```

**Response**:

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_123",
        "courseId": "course_456",
        "courseTitle": "Introduction to React",
        "coursePrice": 9999,
        "currency": "EUR",
        "paymentStatus": "PAID",
        "createdAt": "2025-01-10T15:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

**Error Responses**:

- `401 UNAUTHORIZED`: User is not authenticated

### Create Booking

**Endpoint**: `POST /api/bookings`

**Description**: Create a new course booking for the authenticated user.

**Authentication**: ✅ Required (user must be logged in)

**Request Body**:

```json
{
  "courseId": "course_456"
}
```

**Example Request**:

```bash
curl -X POST "https://your-app.vercel.app/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=<clerk-session-token>" \
  -d '{"courseId": "course_456"}'
```

**Response**:

```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_789",
      "courseId": "course_456",
      "courseTitle": "Introduction to React",
      "price": 9999,
      "paymentStatus": "PENDING",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses**:

- `401 UNAUTHORIZED`: User is not authenticated
- `404 NOT_FOUND`: Course not found or not available
- `409 CONFLICT`: User already has a booking for this course
- `400 VALIDATION_ERROR`: Invalid request data

## Admin API Endpoints

Admin endpoints require both authentication and admin role privileges.

### 1. Users Management

**Endpoint**: `GET /api/admin/users`

**Description**: Retrieve all users with their booking statistics.

**CORS**: ✅ Enabled

**Response**:

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "clerkId": "user_...",
        "email": "user@example.com",
        "name": "John Doe",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "_count": {
          "bookings": 5
        }
      }
    ],
    "total": 10
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "version": "1.0"
  }
}
```

**Error Responses**:

- `401 UNAUTHORIZED`: Not authenticated
- `403 FORBIDDEN`: Not an admin user
- `500 INTERNAL_ERROR`: Server error

### 2. Courses Management (Admin View)

**Endpoint**: `GET /api/admin/courses`

**Description**: Retrieve all courses with their booking statistics (admin endpoint for management
purposes).

**Authentication**: ✅ Required (admin role required)

**CORS**: ✅ Enabled

**Note**: This endpoint requires admin authentication. For public course listings without
authentication, use `/api/courses` instead.

**Response**:

```json
        {
          "success": true,
          "data": {
            "courses": [
              {
                "id": 1,
                "title": "Introduction to React",
                "description": "Learn React basics",
                "price": 9999,
                "duration": 8,
                "createdAt": "2025-01-01T00:00:00.000Z",
                "_count": {
                  "bookings": 25
                }
              }
            ],
            "total": 5
          },
          "meta": {
            "requestId": "req_def456",
            "timestamp": "2025-01-15T10:30:00.000Z",
            "version": "1.0"
          }
        }

**Hinweis:** In der Admin-API wird das Feld `price` als Integer in Cent (EUR) übergeben und zurückgegeben. Beispiel: `9999` entspricht `€99.99`.
```

**Error Responses**:

- `401 UNAUTHORIZED`: Not authenticated
- `403 FORBIDDEN`: Not an admin user
- `500 INTERNAL_ERROR`: Server error

### 3. Analytics

**Endpoint**: `GET /api/admin/analytics`

**Description**: Retrieve analytics data and performance metrics.

**CORS**: ✅ Enabled

**Query Parameters**:

- `timeframe` (optional): Time period for data (default: `24h`)
- `type` (optional): Report type - `summary`, `usage`, `anomalies`, `trace` (default: `summary`)
- `requestId` (required for `trace` type): Specific request ID to trace

**Response**:

```json
{
  "success": true,
  "data": {
    "report": {
      "requests": {
        "total": 1234,
        "successful": 1200,
        "failed": 34
      },
      "performance": {
        "avgResponseTime": 145,
        "p95ResponseTime": 320,
        "p99ResponseTime": 450
      }
    },
    "metadata": {
      "timeframe": "24h",
      "reportType": "summary",
      "generatedAt": "2025-01-15T10:30:00.000Z",
      "requestId": "req_ghi789"
    }
  },
  "meta": {
    "requestId": "req_ghi789",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "version": "1.0"
  }
}
```

**Error Responses**:

- `400 INVALID_INPUT`: Invalid parameters
- `401 UNAUTHORIZED`: Not authenticated
- `403 FORBIDDEN`: Not an admin user
- `500 INTERNAL_ERROR`: Server error

### 4. Error Analytics

**Endpoint**: `GET /api/admin/errors`

**Description**: Retrieve error metrics and logs.

**CORS**: ✅ Enabled

**Query Parameters**:

- `action` (optional): Action type - `metrics` or `logs` (default: `metrics`)
- `timeRange` (optional): Time range - `hour`, `day`, `week` (default: `day`)
- `page` (optional): Page number for logs (default: `1`)
- `limit` (optional): Items per page for logs (default: `50`)

**Response (metrics)**:

```json
{
  "totalErrors": 42,
  "errorRate": 0.034,
  "topErrors": [
    {
      "type": "ValidationError",
      "count": 15,
      "lastOccurred": "2025-01-15T10:25:00.000Z"
    }
  ]
}
```

**Response (logs)**:

```json
{
  "errors": [
    {
      "id": "err_123",
      "type": "ValidationError",
      "message": "Invalid email format",
      "timestamp": "2025-01-15T10:25:00.000Z",
      "resolved": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 42
  }
}
```

**Endpoint**: `POST /api/admin/errors`

**Description**: Manage error logs (resolve or clear).

**CORS**: ✅ Enabled

**Query Parameters**:

- `action` (required): Action type - `resolve` or `clear`

**Request Body (for `resolve` action)**:

```json
{
  "errorId": "err_123"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Error marked as resolved"
}
```

**Error Responses**:

- `400 INVALID_INPUT`: Invalid action or missing parameters
- `401 UNAUTHORIZED`: Not authenticated
- `403 FORBIDDEN`: Not an admin user (or `clear` action in production)
- `500 INTERNAL_ERROR`: Server error

## Error Response Format

All endpoints return errors in a standardized format:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized access"
  },
  "meta": {
    "requestId": "req_xyz890",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "version": "1.0"
  }
}
```

### Error Codes

- `UNAUTHORIZED`: Authentication required or failed
- `FORBIDDEN`: Insufficient permissions (admin role required)
- `INVALID_INPUT`: Invalid request parameters
- `INTERNAL_ERROR`: Server-side error
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed

## Example: Using the API from External App

### Using cURL

```bash
# Get all users
curl -X GET "https://your-app.vercel.app/api/admin/users" \
  -H "Authorization: Bearer <your-clerk-token>" \
  -H "Content-Type: application/json"

# Get analytics summary
curl -X GET "https://your-app.vercel.app/api/admin/analytics?type=summary&timeframe=24h" \
  -H "Authorization: Bearer <your-clerk-token>" \
  -H "Content-Type: application/json"

# Resolve an error
curl -X POST "https://your-app.vercel.app/api/admin/errors?action=resolve" \
  -H "Authorization: Bearer <your-clerk-token>" \
  -H "Content-Type: application/json" \
  -d '{"errorId": "err_123"}'
```

### Using JavaScript/TypeScript

```typescript
// Configure your API client
const API_BASE_URL = 'https://your-app.vercel.app';
const CLERK_TOKEN = '<your-clerk-token>';

// Fetch users
async function getUsers() {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${CLERK_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.error.message}`);
  }

  const data = await response.json();
  return data.data.users;
}

// Fetch analytics
async function getAnalytics(timeframe = '24h', type = 'summary') {
  const params = new URLSearchParams({ timeframe, type });
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${CLERK_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.error.message}`);
  }

  const data = await response.json();
  return data.data.report;
}
```

## Security Considerations

⚠️ **Important Security Warnings for Production**

1. **Wildcard CORS**: Current implementation uses `*` for CORS origin, allowing any domain to access
   admin endpoints. **You MUST restrict this to specific trusted domains in production.**

2. **No Rate Limiting**: No rate limiting is currently implemented. **You MUST add rate limiting
   before deploying to production** to prevent abuse and DoS attacks.

3. **Authentication Required**: All endpoints require valid Clerk authentication

4. **Admin Role Required**: All endpoints require admin role in user metadata

5. **CORS Enabled**: Endpoints are accessible from external origins (see warning #1)

6. **Request Tracking**: All requests include a unique request ID for tracing

7. **Error Monitoring**: All errors are logged to Rollbar (constitutional requirement)

### Production Deployment Checklist

Before deploying to production, ensure you:

- [ ] Restrict CORS origins to specific trusted domains
- [ ] Implement rate limiting on all admin endpoints
- [ ] Set up proper monitoring and alerting for admin API usage
- [ ] Review and test authentication flows
- [ ] Verify admin role assignment process is secure
- [ ] Enable API usage logging and auditing
- [ ] Consider implementing API key authentication for machine-to-machine access
- [ ] Test with production-like load and traffic patterns

## Rate Limiting

⚠️ **Security Warning**: Currently, no rate limiting is implemented on these endpoints. This poses a
security risk for production use, especially with wildcard CORS enabled.

### Recommended Implementation

For production, implement rate limiting using one of these approaches:

**Option 1: Use existing middleware**

The project already has a `withRateLimit` middleware in `lib/middleware/api-error-handling.ts`.
Apply it to admin routes:

```typescript
import { withRateLimit } from '@/lib/middleware/api-error-handling';

export const GET = withRateLimit(
  100,
  15 * 60 * 1000
)(async (request: NextRequest) => {
  // Your handler code
});
```

**Option 2: Use Vercel Rate Limiting**

Configure rate limiting in `vercel.json`:

```json
{
  "functions": {
    "app/api/admin/**/*.ts": {
      "maxDuration": 10,
      "rateLimit": {
        "requests": 100,
        "window": "1m"
      }
    }
  }
}
```

**Option 3: Use a third-party service**

Consider using services like:

- [Upstash Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Unkey](https://www.unkey.com/)
- [Redis-based rate limiting](https://github.com/tj/node-ratelimiter)

### Recommended Rate Limits for Admin Endpoints

- **Users/Courses**: 100 requests per 15 minutes
- **Analytics**: 50 requests per 15 minutes
- **Error Management**: 200 requests per 15 minutes

Adjust these based on your production usage patterns and monitoring data.

## Support

For issues or questions:

1. Check the error response for the `requestId`
2. Review application logs using the `requestId`
3. Check Rollbar for error details
4. Contact the development team

## Constitution Compliance

This API implementation follows the project constitution requirements:

- ✅ Authentication & Security (Section IV)
- ✅ Error Monitoring with Rollbar (Section VI)
- ✅ Test-First Development (11 E2E tests)
- ✅ Code Quality & Formatting (Prettier, ESLint)
- ✅ Standardized API responses with error handling
