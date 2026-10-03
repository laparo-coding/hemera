/**
 * Route-level contract tests for the seminar recording service endpoints
 * whose response shapes are dictated by the Aither OpenAPI contract:
 * - GET /api/service/bookings/[bookingId] (flat BookingContext)
 * - GET /api/service/seminar-recording-jobs (flat { items })
 * Both are parsed by Aither's client with top-level zod schemas, so any
 * envelope wrapper breaks the worker.
 */

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockAuthenticate } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findUnique: vi.fn() },
    seminarRecordingWorkflow: { findMany: vi.fn() },
  },
  mockAuthenticate: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth/service-auth', () => ({
  authenticateServiceRequest: mockAuthenticate,
}));
vi.mock('@/lib/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));
vi.mock('@/lib/utils/api-logger', () => ({
  createApiLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
}));

import { GET as getBookingContext } from '@/app/api/service/bookings/[bookingId]/route';
import { GET as listJobs } from '@/app/api/service/seminar-recording-jobs/route';

const workflowRow = {
  id: 'workflow-001',
  bookingId: 'booking-001',
  originalBookingId: 'booking-001',
  participantUserId: 'participant-001',
  recordingId: 'recording-001',
  status: 'QUEUED',
  recordingDate: new Date('2026-09-30T10:00:00.000Z'),
  queuedAt: new Date('2026-09-30T10:00:00.000Z'),
  firstProviderAttemptAt: null,
  assemblyAiTranscriptId: null,
  assemblyAiStatus: null,
  sourceBlobPathname: null,
  muxAssetId: null,
  muxPlaybackId: null,
  muxPlaybackUrl: null,
  durationSeconds: null,
  transcriptBlobPathname: null,
  stageAttemptCounts: {},
  nextAttemptAt: null,
  assemblyAiCleanupStatus: 'NOT_REQUIRED',
  sourceBlobCleanupStatus: 'NOT_REQUIRED',
  reviewedSpeakerMapping: null,
  reviewedBy: null,
  reviewedAt: null,
  deletionRequestedAt: null,
  deletionConfirmedAt: null,
  deletionReason: null,
  lastErrorCode: null,
};

describe('GET /api/service/bookings/[bookingId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticate.mockResolvedValue({
      userId: 'service-user',
      role: 'api-client',
    });
  });

  it('returns the flat BookingContext body per the contract', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'booking-001',
      userId: 'participant-001',
      courseId: 'course-001',
    });

    const response = await getBookingContext(
      new NextRequest('http://localhost/api/service/bookings/booking-001'),
      { params: Promise.resolve({ bookingId: 'booking-001' }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    // No { success, data } envelope: Aither parses the top-level object.
    expect(payload).toEqual({
      bookingId: 'booking-001',
      participantUserId: 'participant-001',
      courseId: 'course-001',
    });
  });

  it('returns 404 for an unknown booking', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    const response = await getBookingContext(
      new NextRequest('http://localhost/api/service/bookings/missing'),
      { params: Promise.resolve({ bookingId: 'missing' }) }
    );

    expect(response.status).toBe(404);
  });
});

describe('GET /api/service/seminar-recording-jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticate.mockResolvedValue({
      userId: 'service-user',
      role: 'api-client',
    });
    mockPrisma.seminarRecordingWorkflow.findMany.mockResolvedValue([
      workflowRow,
    ]);
  });

  it('returns the flat { items } body per the contract', async () => {
    const response = await listJobs(
      new NextRequest(
        'http://localhost/api/service/seminar-recording-jobs?status=queued,retryable_failure&limit=20'
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    // No { success, data } envelope: Aither's JobListingSchema parses
    // { items: [...] } at the top level.
    expect(Object.keys(payload)).toEqual(['items']);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toMatchObject({
      bookingId: 'booking-001',
      recordingId: 'recording-001',
      status: 'queued',
    });
  });

  it('accepts wire-format statuses and queries Prisma enum values', async () => {
    await listJobs(
      new NextRequest(
        'http://localhost/api/service/seminar-recording-jobs?status=queued,retryable_failure'
      )
    );

    expect(mockPrisma.seminarRecordingWorkflow.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ['QUEUED', 'RETRYABLE_FAILURE'] } },
      })
    );
  });

  it('serializes workflow fields in the wire format', async () => {
    const response = await listJobs(
      new NextRequest(
        'http://localhost/api/service/seminar-recording-jobs?status=queued'
      )
    );
    const payload = await response.json();

    expect(payload.items[0]).toMatchObject({
      status: 'queued',
      assemblyAiCleanupStatus: 'not_required',
      sourceBlobCleanupStatus: 'not_required',
      deletionReason: null,
      nextAttemptAt: null,
      durationSeconds: null,
    });
  });

  it('rejects an unknown wire status with 400', async () => {
    const response = await listJobs(
      new NextRequest(
        'http://localhost/api/service/seminar-recording-jobs?status=not_a_status'
      )
    );

    expect(response.status).toBe(400);
    expect(mockPrisma.seminarRecordingWorkflow.findMany).not.toHaveBeenCalled();
  });

  it('rejects Prisma-style uppercase statuses at the boundary', async () => {
    const response = await listJobs(
      new NextRequest(
        'http://localhost/api/service/seminar-recording-jobs?status=QUEUED'
      )
    );

    expect(response.status).toBe(400);
  });
});
