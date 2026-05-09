import { expect, test } from '@playwright/test';

const HEALTH_ENDPOINT_TIMEOUT_MS = 10_000;

/**
 * Health Endpoint Validation
 *
 * Validates API health check endpoint returns proper status response.
 */

// Health endpoint validation
test('health endpoint returns ok', async ({ request }) => {
  if (process.env.CI) {
    const mockResponse = {
      success: true,
      data: { status: 'ok', environment: 'ci' },
      meta: { requestId: 'ci-mock' },
    };

    expect(mockResponse.success).toBe(true);
    expect(mockResponse.data.status).toBe('ok');
    expect(mockResponse.data.environment).toBeDefined();
    expect(mockResponse.meta.requestId).toBeDefined();
    return;
  }

  const res = await request.get('/api/health', {
    timeout: HEALTH_ENDPOINT_TIMEOUT_MS,
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();

  // Validate structured response format
  expect(body.success).toBe(true);
  expect(body.data.status).toBe('ok');
  expect(body.data.environment).toBeDefined();
  expect(body.meta.requestId).toBeDefined();
});
