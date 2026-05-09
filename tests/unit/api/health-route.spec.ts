import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockInfo = jest.fn();
const mockTrackRequestCompletion = jest.fn();
const mockLoggerInfo = jest.fn();

jest.mock('@/lib/buildInfo', () => ({
  getBuildInfo: () => mockInfo(),
}));

jest.mock('@/lib/utils/api-logger', () => ({
  createApiLogger: jest.fn().mockReturnValue({
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    trackRequestCompletion: (...args: unknown[]) =>
      mockTrackRequestCompletion(...args),
  }),
}));

describe('GET /api/health', () => {
  const originalPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const originalSecretKey = process.env.CLERK_SECRET_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInfo.mockReturnValue({
      environment: 'development',
      version: '1.2.3',
      commitSha: 'abcdef123456',
      shortSha: 'abcdef1',
      buildTime: '2026-05-08T10:00:00.000Z',
    });
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublishableKey;
    process.env.CLERK_SECRET_KEY = originalSecretKey;
  });

  it('keeps Clerk bypass diagnostics out of the public response', async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_public123';
    process.env.CLERK_SECRET_KEY = 'sk_live_secret456';

    const { GET } = await import('@/app/api/health/route');
    const response = await GET(
      new NextRequest('http://localhost:3000/api/health')
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.auth).toBeUndefined();
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      'Health check completed',
      expect.objectContaining({
        auth: expect.objectContaining({
          clerk: expect.objectContaining({ bypassed: true }),
        }),
      })
    );
    expect(mockTrackRequestCompletion).toHaveBeenCalledWith(200);
  });
});