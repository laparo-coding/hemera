/**
 * Route-level contract tests for the seminar document access proxy.
 *
 * Focus: IDOR protection. The browser sends `bookingId` and `recordingId`, but
 * authorization must come from the Clerk session and a database lookup scoped
 * to that user, never from the request body.
 */

import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, mockFindFirst, mockCheckRateLimit, mockLogger } = vi.hoisted(
  () => ({
    mockAuth: vi.fn(),
    mockFindFirst: vi.fn(),
    mockCheckRateLimit: vi.fn(),
    mockLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  })
);

vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }));
vi.mock('@/lib/db/prisma', () => ({
  prisma: { seminarRecordingWorkflow: { findFirst: mockFindFirst } },
}));
vi.mock('@/lib/middleware/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
}));
vi.mock('@/lib/utils/api-logger', () => ({
  createApiLogger: () => mockLogger,
}));

import { POST } from '@/app/api/service/seminar-document-access-proxy/route';

// Random per run: a value nothing else can contain keeps the leak assertions strict.
const SERVICE_KEY = randomBytes(24).toString('hex');
const AITHER_ORIGIN = 'https://aither.example.com';
const ACCESS_URL = `${AITHER_ORIGIN}/api/service/seminar-document-access`;
const NOT_FOUND_MESSAGE = 'Seminaraufnahme nicht gefunden';

const aitherAccess = {
  muxPlaybackUrl:
    'https://stream.mux.com/playback-a.m3u8?token=signed-mux-token',
  transcriptUrl:
    'https://blob.example.com/transcripts/recording-a.json?sig=signed-blob-token',
  muxExpiresAt: '2026-09-30T10:05:00.000Z',
  transcriptExpiresAt: '2026-09-30T10:05:00.000Z',
};

const PAST_START = new Date('2020-01-01T00:00:00.000Z');
const FUTURE_START = new Date('2999-01-01T00:00:00.000Z');

const requestBody = { bookingId: 'booking-a', recordingId: 'recording-a' };

interface WorkflowRow {
  bookingId: string | null;
  recordingId: string;
  status: string;
  participantUserId: string;
  booking: { userId: string; course: { startDate: Date | null } } | null;
}

function workflowRow(overrides: Partial<WorkflowRow> = {}): WorkflowRow {
  return {
    bookingId: 'booking-a',
    recordingId: 'recording-a',
    status: 'READY',
    participantUserId: 'user-a',
    booking: { userId: 'user-a', course: { startDate: PAST_START } },
    ...overrides,
  };
}

// Evaluates Prisma-style equality and relation filters against in-memory rows,
// so dropping an ownership condition from the route's query fails the tests.
function matchesFilter(value: unknown, filter: unknown): boolean {
  if (filter !== null && typeof filter === 'object') {
    if (value === null || typeof value !== 'object') {
      return false;
    }
    return Object.entries(filter).every(([key, expected]) =>
      matchesFilter((value as Record<string, unknown>)[key], expected)
    );
  }
  return value === filter;
}

function seedWorkflows(rows: WorkflowRow[]) {
  mockFindFirst.mockImplementation(({ where }: { where: unknown }) => {
    const found = rows.find(row => matchesFilter(row, where));
    if (!found) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      bookingId: found.bookingId,
      recordingId: found.recordingId,
      booking: found.booking && {
        course: { startDate: found.booking.course.startDate },
      },
    });
  });
}

function signIn(userId: string | null) {
  mockAuth.mockResolvedValue({ userId });
}

function createRawRequest(
  rawBody: string,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(
    'http://localhost/api/service/seminar-document-access-proxy',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: rawBody,
    }
  );
}

function createRequest(
  body: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  return createRawRequest(JSON.stringify(body), headers);
}

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn();

function lastFetchCall(): { url: string; init: RequestInit } {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) {
    throw new Error('fetch was not called');
  }
  const [url, init] = call as [URL | string, RequestInit];
  return { url: String(url), init };
}

describe('POST /api/service/seminar-document-access-proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn('user-a');
    mockCheckRateLimit.mockResolvedValue(null);
    seedWorkflows([workflowRow()]);
    fetchMock.mockResolvedValue(jsonResponse(200, aitherAccess));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('AITHER_API_URL', AITHER_ORIGIN);
    vi.stubEnv('AITHER_SERVICE_KEY', SERVICE_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('authentication', () => {
    it('rejects requests without a Clerk session before any lookup', async () => {
      signIn(null);

      const response = await POST(createRequest(requestBody));

      expect(response.status).toBe(401);
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
      expect(mockFindFirst).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not accept an API key as a substitute for a participant session', async () => {
      signIn(null);

      const response = await POST(
        createRequest(requestBody, {
          'x-api-key': 'service-key-of-another-client',
        })
      );

      expect(response.status).toBe(401);
      expect(mockFindFirst).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('ownership (IDOR)', () => {
    it('returns signed links to the owner of a ready recording', async () => {
      const response = await POST(createRequest(requestBody));
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(payload).toMatchObject({ success: true, data: aitherAccess });
      expect(JSON.stringify(payload)).not.toContain(SERVICE_KEY);
      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        'user-a',
        'user',
        expect.any(String)
      );
    });

    it('scopes the lookup to the session user instead of trusting the body', async () => {
      await POST(createRequest(requestBody));

      expect(mockFindFirst).toHaveBeenCalledTimes(1);
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            bookingId: 'booking-a',
            recordingId: 'recording-a',
            status: 'READY',
            participantUserId: 'user-a',
            booking: { userId: 'user-a' },
          },
        })
      );
    });

    it('answers a foreign booking exactly like an unknown one', async () => {
      signIn('user-b');

      const foreign = await POST(createRequest(requestBody));
      const unknown = await POST(
        createRequest({
          bookingId: 'booking-unknown',
          recordingId: 'recording-unknown',
        })
      );

      expect(foreign.status).toBe(404);
      expect(unknown.status).toBe(404);
      const foreignBody = await foreign.json();
      const unknownBody = await unknown.json();
      expect(foreignBody.error).toEqual(unknownBody.error);
      expect(foreignBody.error.message).toBe(NOT_FOUND_MESSAGE);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('logs only identifiers when access is denied', async () => {
      signIn('user-b');

      await POST(createRequest(requestBody));

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Seminar document access denied',
        { userId: 'user-b', bookingId: 'booking-a', recordingId: 'recording-a' }
      );
    });

    it.each([
      ['a recording of another booking', 'booking-a', 'recording-b'],
      ['a booking paired with a foreign recording', 'booking-b', 'recording-a'],
    ])('rejects %s', async (_label, bookingId, recordingId) => {
      seedWorkflows([
        workflowRow(),
        workflowRow({
          bookingId: 'booking-b',
          recordingId: 'recording-b',
          participantUserId: 'user-b',
          booking: { userId: 'user-b', course: { startDate: PAST_START } },
        }),
      ]);

      const response = await POST(createRequest({ bookingId, recordingId }));

      expect(response.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each(['user-a', 'user-b'])(
      'rejects %s when workflow participant and booking owner disagree',
      async userId => {
        seedWorkflows([
          workflowRow({
            participantUserId: 'user-b',
            booking: { userId: 'user-a', course: { startDate: PAST_START } },
          }),
        ]);
        signIn(userId);

        const response = await POST(createRequest(requestBody));

        expect(response.status).toBe(404);
        expect(fetchMock).not.toHaveBeenCalled();
      }
    );

    it.each([
      'QUEUED',
      'TRANSCRIBING',
      'TRANSCRIPT_READY',
      'REVIEW_REQUIRED',
      'PUBLISHING',
      'RETRYABLE_FAILURE',
      'FAILED',
      'DELETION_PENDING',
      'DELETED',
    ])('rejects a recording in status %s', async status => {
      seedWorkflows([workflowRow({ status })]);

      const response = await POST(createRequest(requestBody));

      expect(response.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a recording whose booking has been deleted', async () => {
      seedWorkflows([workflowRow({ bookingId: null, booking: null })]);

      const response = await POST(createRequest(requestBody));

      expect(response.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a lookup result without a booking even if the query returned it', async () => {
      mockFindFirst.mockResolvedValue({
        bookingId: null,
        recordingId: 'recording-a',
        booking: null,
      });

      const response = await POST(createRequest(requestBody));

      expect(response.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
      ['starts in the future', FUTURE_START],
      ['has no start date', null],
    ])(
      'keeps the recording locked while the course %s',
      async (_label, startDate) => {
        seedWorkflows([
          workflowRow({ booking: { userId: 'user-a', course: { startDate } } }),
        ]);

        const response = await POST(createRequest(requestBody));

        expect(response.status).toBe(404);
        expect(fetchMock).not.toHaveBeenCalled();
      }
    );
  });

  describe('request validation', () => {
    it.each([
      ['a missing bookingId', { recordingId: 'recording-a' }],
      ['a missing recordingId', { bookingId: 'booking-a' }],
      ['an empty bookingId', { bookingId: '', recordingId: 'recording-a' }],
      ['a non-string bookingId', { bookingId: 42, recordingId: 'recording-a' }],
      [
        'an oversized recordingId',
        { bookingId: 'booking-a', recordingId: 'r'.repeat(129) },
      ],
      [
        'a client-supplied participant',
        { ...requestBody, participantUserId: 'user-b' },
      ],
      ['a client-supplied user id', { ...requestBody, userId: 'user-b' }],
      ['an array body', []],
      ['a null body', null],
    ])('rejects %s with 400', async (_label, body) => {
      const response = await POST(createRequest(body));

      expect(response.status).toBe(400);
      expect(mockFindFirst).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects malformed JSON with 400', async () => {
      const response = await POST(createRawRequest('{"bookingId":'));

      expect(response.status).toBe(400);
      expect(mockFindFirst).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('returns the rate limit response before any lookup', async () => {
      mockCheckRateLimit.mockResolvedValue(
        NextResponse.json({ error: 'rate limited' }, { status: 429 })
      );

      const response = await POST(createRequest(requestBody));

      expect(response.status).toBe(429);
      expect(mockFindFirst).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('Aither access', () => {
    it('calls Aither server-to-server with the service key', async () => {
      await POST(createRequest(requestBody));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const { url, init } = lastFetchCall();
      expect(url).toBe(ACCESS_URL);
      expect(init).toMatchObject({
        method: 'POST',
        cache: 'no-store',
        redirect: 'error',
        headers: { 'X-Aither-Service-Key': SERVICE_KEY },
      });
      expect(init.signal).toBeInstanceOf(AbortSignal);
      expect(JSON.parse(String(init.body))).toEqual(requestBody);
    });

    it('ignores any path configured on the Aither URL', async () => {
      vi.stubEnv('AITHER_API_URL', `${AITHER_ORIGIN}/internal/proxy?x=1`);

      const response = await POST(createRequest(requestBody));

      expect(response.status).toBe(200);
      expect(lastFetchCall().url).toBe(ACCESS_URL);
    });

    it('allows plain http for loopback development URLs', async () => {
      vi.stubEnv('AITHER_API_URL', 'http://localhost:3001');

      const response = await POST(createRequest(requestBody));

      expect(response.status).toBe(200);
      expect(lastFetchCall().url).toBe(
        'http://localhost:3001/api/service/seminar-document-access'
      );
    });

    it.each([
      ['no URL', '', SERVICE_KEY],
      ['no service key', AITHER_ORIGIN, ''],
      ['a too short service key', AITHER_ORIGIN, 'too-short'],
      ['a cleartext remote URL', 'http://aither.example.com', SERVICE_KEY],
      ['a malformed URL', 'not a url', SERVICE_KEY],
    ])(
      'answers 503 without calling Aither for %s',
      async (_label, url, key) => {
        vi.stubEnv('AITHER_API_URL', url);
        vi.stubEnv('AITHER_SERVICE_KEY', key);

        const response = await POST(createRequest(requestBody));

        expect(response.status).toBe(503);
        expect(fetchMock).not.toHaveBeenCalled();
      }
    );

    it.each([
      [404, 404],
      [409, 409],
      [400, 502],
      [401, 502],
      [403, 502],
      [500, 502],
      [503, 502],
    ])('maps an Aither %i response to %i', async (upstream, expected) => {
      fetchMock.mockResolvedValue(
        jsonResponse(upstream, { error: 'upstream' })
      );

      const response = await POST(createRequest(requestBody));

      expect(response.status).toBe(expected);
    });

    it.each([
      ['a network error', new TypeError('fetch failed')],
      [
        'a timeout',
        new DOMException('The operation timed out', 'TimeoutError'),
      ],
    ])('answers 502 when Aither fails with %s', async (_label, error) => {
      fetchMock.mockRejectedValue(error);

      const response = await POST(createRequest(requestBody));

      expect(response.status).toBe(502);
    });

    it.each([
      ['a non-JSON body', () => new Response('<html>oops</html>')],
      [
        'missing fields',
        () =>
          jsonResponse(200, { muxPlaybackUrl: aitherAccess.muxPlaybackUrl }),
      ],
      [
        'a cleartext media URL',
        () =>
          jsonResponse(200, {
            ...aitherAccess,
            muxPlaybackUrl: 'http://stream.mux.com/playback-a.m3u8',
          }),
      ],
      [
        'a javascript: URL',
        () =>
          jsonResponse(200, {
            ...aitherAccess,
            transcriptUrl: 'javascript:alert(1)',
          }),
      ],
      [
        'an invalid expiry',
        () => jsonResponse(200, { ...aitherAccess, muxExpiresAt: 'tomorrow' }),
      ],
    ])('answers 502 when Aither returns %s', async (_label, createUpstream) => {
      fetchMock.mockResolvedValue(createUpstream());

      const response = await POST(createRequest(requestBody));

      expect(response.status).toBe(502);
    });

    it('does not pass unknown upstream fields through to the browser', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(200, { ...aitherAccess, internalToken: 'upstream-only' })
      );

      const response = await POST(createRequest(requestBody));
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.data).toEqual(aitherAccess);
      expect(JSON.stringify(payload)).not.toContain('upstream-only');
    });

    it('answers 500 without leaking internals for unexpected failures', async () => {
      mockFindFirst.mockRejectedValue(new Error('connection string leaked'));

      const response = await POST(createRequest(requestBody));
      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(JSON.stringify(payload)).not.toContain('connection string leaked');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    function loggedOutput(): string {
      const calls = [
        ...mockLogger.info.mock.calls,
        ...mockLogger.warn.mock.calls,
        ...mockLogger.error.mock.calls,
      ];
      return JSON.stringify(
        calls.map(args =>
          args.map((arg: unknown) =>
            arg instanceof Error
              ? { ...arg, name: arg.name, message: arg.message }
              : arg
          )
        )
      );
    }

    it.each([
      ['a successful request', () => jsonResponse(200, aitherAccess)],
      [
        'an invalid payload carrying signed URLs',
        () =>
          jsonResponse(200, {
            ...aitherAccess,
            muxPlaybackUrl:
              'http://stream.mux.com/x.m3u8?token=signed-mux-token',
          }),
      ],
      ['an upstream error', () => jsonResponse(500, aitherAccess)],
    ])(
      'never logs the service key or signed URLs for %s',
      async (_label, createUpstream) => {
        fetchMock.mockResolvedValue(createUpstream());

        await POST(createRequest(requestBody));

        const output = loggedOutput();
        expect(output).not.toContain(SERVICE_KEY);
        expect(output).not.toContain('signed-mux-token');
        expect(output).not.toContain('signed-blob-token');
      }
    );

    it('does not log details of the underlying network error', async () => {
      fetchMock.mockRejectedValue(
        new TypeError(
          'connect failed: https://aither.example.com?token=secret-in-error'
        )
      );

      const response = await POST(createRequest(requestBody));

      expect(response.status).toBe(502);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(loggedOutput()).not.toContain('secret-in-error');
    });
  });
});
