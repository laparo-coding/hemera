# Aither Integration Guide

## Service User Credentials

**Email:** `service-user@laparo.biz`  
**Password:** `soqtAg-wighem-wehxy0`  
**Role:** `api-client`

⚠️ **Security Note:** These credentials should be stored securely in Aither's environment variables, never committed to git.

---

## Aither Setup

### 1. Environment Variables

Add to Aither's `.env.local`:

```bash
# Hemera Service API
HEMERA_API_URL=https://hemera-academy.vercel.app
HEMERA_SERVICE_USER_EMAIL=service-user@laparo.biz
HEMERA_SERVICE_USER_PASSWORD=soqtAg-wighem-wehxy0

# Clerk (for JWT generation)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
```

### 2. Authentication Flow

Aither needs to authenticate with Clerk using the service user credentials to get a JWT token:

```typescript
// lib/hemera-api-client.ts
import { clerkClient } from '@clerk/nextjs/server';

export async function getHemeraApiToken(): Promise<string> {
  // Option 1: Use Clerk Backend API to get token for service user
  const sessions = await clerkClient.sessions.getSessionList({
    userId: 'service-user-id', // Get this from Clerk Dashboard
  });
  
  if (sessions.length === 0) {
    throw new Error('No active session for service user');
  }
  
  const token = await clerkClient.sessions.getToken(
    sessions[0].id,
    'hemera-api'
  );
  
  return token;
}

// Option 2: Use Clerk sign-in flow (for initial setup)
export async function signInServiceUser() {
  const response = await fetch(`${process.env.HEMERA_API_URL}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.HEMERA_SERVICE_USER_EMAIL,
      password: process.env.HEMERA_SERVICE_USER_PASSWORD,
    }),
  });
  
  const { token } = await response.json();
  return token;
}
```

### 3. API Client

Create a Hemera API client in Aither:

```typescript
// lib/hemera-api-client.ts
export class HemeraApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.HEMERA_API_URL || 'https://hemera-academy.vercel.app';
  }

  private async getToken(): Promise<string> {
    if (!this.token) {
      this.token = await getHemeraApiToken();
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    return response.json();
  }

  // Get all courses
  async getCourses(params?: {
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    published?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/service/courses?${query}`);
  }

  // Get course details
  async getCourse(courseId: string) {
    return this.request(`/api/service/courses/${courseId}`);
  }

  // Get participation details
  async getParticipation(participationId: string) {
    return this.request(`/api/service/participations/${participationId}`);
  }

  // Update participation result
  async updateParticipationResult(
    participationId: string,
    data: {
      resultOutcome?: string;
      resultNotes?: string;
      complete?: boolean;
    }
  ) {
    return this.request(`/api/service/participations/${participationId}/result`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const hemeraApi = new HemeraApiClient();
```

### 4. Usage Example

```typescript
// app/api/sync-courses/route.ts
import { hemeraApi } from '@/lib/hemera-api-client';

export async function GET() {
  try {
    // Fetch courses from Hemera
    const { data: courses } = await hemeraApi.getCourses({
      published: true,
      limit: 100,
    });

    // Process courses in Aither
    // ...

    return Response.json({ success: true, count: courses.length });
  } catch (error) {
    console.error('Failed to sync courses:', error);
    return Response.json(
      { error: 'Failed to sync courses' },
      { status: 500 }
    );
  }
}
```

---

## Rate Limiting

The service user has a rate limit of **100 requests per minute**.

If you exceed this limit, you'll receive a `429 Too Many Requests` response with headers:
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: 0
- `X-RateLimit-Reset`: Unix timestamp when limit resets

Implement exponential backoff:

```typescript
async function requestWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        const resetTime = error.headers?.['x-ratelimit-reset'];
        const waitTime = resetTime
          ? (Number(resetTime) * 1000 - Date.now())
          : Math.pow(2, i) * 1000;
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Error Handling

All Hemera API errors follow this schema:

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  },
  meta: {
    requestId: string,
    timestamp: string,
    version: string
  }
}
```

Common error codes:
- `AUTH_REQUIRED` (401): Missing or invalid JWT token
- `FORBIDDEN` (403): Insufficient permissions (not api-client or admin)
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

---

## Testing

Test the integration locally:

```bash
# In Aither project
curl -X GET "http://localhost:3000/api/sync-courses"
```

Or use the Hemera API directly:

```bash
# Get JWT token first (manual step)
TOKEN="<your-jwt-token>"

# Test courses endpoint
curl -X GET "https://hemera-academy.vercel.app/api/service/courses" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

### "Not authenticated" (401)
- Check that JWT token is valid and not expired
- Verify service user credentials are correct
- Ensure `Authorization: Bearer <token>` header is present

### "Forbidden" (403)
- Verify service user has `api-client` role in Clerk
- Check `publicMetadata.role` in Clerk Dashboard

### "Rate limit exceeded" (429)
- Implement exponential backoff
- Consider caching responses
- Reduce request frequency

### "Internal server error" (500)
- Check Hemera's Rollbar for error details
- Verify request payload is valid
- Contact Hemera team if issue persists

---

## Security Best Practices

1. **Never commit credentials** to git
2. **Use environment variables** for all sensitive data
3. **Rotate credentials** regularly (every 90 days)
4. **Monitor API usage** via rate limit headers
5. **Log all API errors** for debugging
6. **Implement request timeouts** (30 seconds recommended)
7. **Use HTTPS only** in production

---

## Support

For issues or questions:
- Check [`specs/025-service-user-endpoint/quickstart.md`](quickstart.md)
- Review [`specs/025-service-user-endpoint/openapi-service-endpoints.yaml`](openapi-service-endpoints.yaml)
- Contact Hemera team

---

## Staging Deploy Notes

When deploying these service endpoints to Staging, follow these steps:

1. Deploy the application branch `feat/025-service-user-endpoints` to the Staging environment.
2. Apply the new database migration `prisma/migrations/20260215140000_add_api_log/migration.sql` to the staging DB (do not run destructive resets).
3. Feature-flag guidance:
  - By default the service API returns the modern shapes (arrays/objects) in `data`.
  - To enable legacy response compatibility for downstream consumers temporarily, set:

```bash
FEATURE_SERVICE_RESPONSE_LEGACY=true
```

  - Verify consumers using the legacy shape can parse responses correctly.
4. Run smoke tests against Staging:

```bash
# example smoke test commands
curl -H "Authorization: Bearer $TOKEN" "$HEMERA_API_URL/api/service/courses" | jq .
curl -H "Authorization: Bearer $TOKEN" "$HEMERA_API_URL/api/service/courses/<id>" | jq .
```

5. After validation, if no legacy compatibility is required, unset `FEATURE_SERVICE_RESPONSE_LEGACY` and proceed to production rollout.

If you want, I can prepare a staging PR checklist or run these steps for you (requires staging credentials). 
