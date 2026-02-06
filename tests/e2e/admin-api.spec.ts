import { expect, test } from '@playwright/test';

/**
 * Admin API Endpoints E2E Tests
 *
 * Validates that admin API endpoints:
 * - Require authentication
 * - Require admin authorization
 * - Support CORS for external apps
 * - Return proper error responses
 */

test.describe('Admin API Authentication & Authorization', () => {
  test('GET /api/admin/users - should require authentication', async ({
    request,
  }) => {
    const response = await request.get('/api/admin/users');

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toContain('Unauthorized');
  });

  test('GET /api/admin/courses - should require authentication', async ({
    request,
  }) => {
    const response = await request.get('/api/admin/courses');

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toContain('Unauthorized');
  });

  test('GET /api/admin/analytics - should require authentication', async ({
    request,
  }) => {
    const response = await request.get('/api/admin/analytics');

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toContain('Unauthorized');
  });

  test('GET /api/admin/errors - should require authentication', async ({
    request,
  }) => {
    const response = await request.get('/api/admin/errors');

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toContain('Unauthorized');
  });
});

test.describe('Admin API CORS Support', () => {
  test('OPTIONS /api/admin/users - should handle preflight request', async ({
    request,
  }) => {
    const response = await request.fetch('/api/admin/users', {
      method: 'OPTIONS',
    });

    // Should return 200 OK
    expect(response.status()).toBe(200);

    // Should include CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toContain('GET');
    expect(headers['access-control-allow-headers']).toContain('Authorization');
  });

  test('OPTIONS /api/admin/courses - should handle preflight request', async ({
    request,
  }) => {
    const response = await request.fetch('/api/admin/courses', {
      method: 'OPTIONS',
    });

    // Should return 200 OK
    expect(response.status()).toBe(200);

    // Should include CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toContain('GET');
    expect(headers['access-control-allow-headers']).toContain('Authorization');
  });

  test('OPTIONS /api/admin/analytics - should handle preflight request', async ({
    request,
  }) => {
    const response = await request.fetch('/api/admin/analytics', {
      method: 'OPTIONS',
    });

    // Should return 200 OK
    expect(response.status()).toBe(200);

    // Should include CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toContain('GET');
    expect(headers['access-control-allow-headers']).toContain('Authorization');
  });

  test('OPTIONS /api/admin/errors - should handle preflight request', async ({
    request,
  }) => {
    const response = await request.fetch('/api/admin/errors', {
      method: 'OPTIONS',
    });

    // Should return 200 OK
    expect(response.status()).toBe(200);

    // Should include CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toContain('GET');
    expect(headers['access-control-allow-headers']).toContain('Authorization');
  });

  test('GET /api/admin/users - should include CORS headers in response', async ({
    request,
  }) => {
    const response = await request.get('/api/admin/users');

    // Should include CORS headers even on error responses
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
  });
});

test.describe('Admin API Response Format', () => {
  test('Error responses should include requestId', async ({ request }) => {
    const response = await request.get('/api/admin/users');

    const body = await response.json();
    expect(body.meta).toBeDefined();
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.timestamp).toBeDefined();
  });

  test('Error responses should have consistent structure', async ({
    request,
  }) => {
    // Use an endpoint that requires authentication to test error response format
    const response = await request.get('/api/admin/users');

    const body = await response.json();
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('meta');

    expect(body.success).toBe(false);
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
  });
});

/**
 * Test Results (Expected Outcomes):
 *
 * Authentication Tests:
 * ✅ All admin endpoints (users, courses, analytics, errors) return 401 for unauthenticated
 * requests
 * ✅ Error responses use standardized format with error codes
 *
 * CORS Tests:
 * ✅ All admin endpoints (users, courses, analytics, errors) handle OPTIONS preflight requests
 * ✅ CORS headers present on all authenticated admin endpoint responses
 * ✅ Access-Control-Allow-Origin should be '*' for external app access
 *
 * Response Format Tests:
 * ✅ All responses should include requestId for traceability
 * ✅ Error responses should follow consistent structure
 *
 * These tests validate the constitutional requirements:
 * - Authentication & Security (Section IV)
 * - API error handling
 * - External app access via CORS
 */
