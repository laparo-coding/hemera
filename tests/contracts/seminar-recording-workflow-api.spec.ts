/**
 * Route-level contract tests for seminar recording workflow updates.
 */

import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockTransaction, mockAuthenticate } = vi.hoisted(() => {
  const transaction = {
    booking: { findUnique: vi.fn() },
    seminarRecordingWorkflow: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    seminarRecordingIdempotency: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    seminarRecordingDeletionOutbox: { deleteMany: vi.fn() },
    seminarRecordingTraceEvent: { create: vi.fn() },
  };
  return {
    mockTransaction: transaction,
    mockPrisma: {
      ...transaction,
      $transaction: vi.fn(),
    },
    mockAuthenticate: vi.fn(),
  };
});

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

import { PUT } from '@/app/api/service/bookings/[bookingId]/seminar-recordings/[recordingId]/route';

const params = Promise.resolve({
  bookingId: 'booking-001',
  recordingId: 'recording-001',
});

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    'http://localhost/api/service/bookings/booking-001/seminar-recordings/recording-001',
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'request-001',
      },
      body: JSON.stringify(body),
    }
  );
}

const validBody = {
  status: 'queued',
  recordingDate: '2026-09-30T10:00:00.000Z',
};

describe('PUT seminar recording workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticate.mockResolvedValue({
      userId: 'service-user',
      role: 'api-client',
    });
    mockPrisma.$transaction.mockImplementation(callback =>
      (callback as (tx: typeof mockTransaction) => Promise<unknown>)(
        mockTransaction
      )
    );
    mockTransaction.seminarRecordingIdempotency.findUnique.mockResolvedValue(
      null
    );
    mockTransaction.booking.findUnique.mockResolvedValue({
      id: 'booking-001',
      userId: 'participant-001',
    });
    mockTransaction.seminarRecordingWorkflow.findUnique.mockResolvedValue(null);
    mockTransaction.seminarRecordingWorkflow.updateMany.mockResolvedValue({
      count: 1,
    });
    mockTransaction.seminarRecordingWorkflow.create.mockResolvedValue({
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
    });
    mockTransaction.seminarRecordingWorkflow.findUniqueOrThrow.mockResolvedValue(
      {}
    );
    mockTransaction.seminarRecordingIdempotency.create.mockResolvedValue({});
    mockTransaction.seminarRecordingTraceEvent.create.mockResolvedValue({});
    mockTransaction.seminarRecordingWorkflow.delete.mockResolvedValue({});
  });

  it('returns 409 for an invalid transition', async () => {
    mockTransaction.seminarRecordingWorkflow.findUnique.mockResolvedValue({
      id: 'workflow-001',
      status: 'READY',
    });

    const response = await PUT(createRequest(validBody), { params });

    expect(response.status).toBe(409);
    expect(
      mockTransaction.seminarRecordingWorkflow.updateMany
    ).not.toHaveBeenCalled();
  });

  it('returns 400 when a stage attempt count exceeds five', async () => {
    const response = await PUT(
      createRequest({
        ...validBody,
        stageAttemptCounts: { transcribe: 6 },
      }),
      { params }
    );

    expect(response.status).toBe(400);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns 409 when a new workflow does not start in QUEUED', async () => {
    const response = await PUT(
      createRequest({ ...validBody, status: 'transcribing' }),
      { params }
    );

    expect(response.status).toBe(409);
    expect(
      mockTransaction.seminarRecordingWorkflow.create
    ).not.toHaveBeenCalled();
  });

  it('rejects reuse of an idempotency key with a different request body', async () => {
    mockTransaction.seminarRecordingIdempotency.findUnique.mockResolvedValue({
      requestHash: 'different-request-hash',
      response: { accepted: true },
    });

    const response = await PUT(createRequest(validBody), { params });

    expect(response.status).toBe(409);
    expect(mockTransaction.booking.findUnique).not.toHaveBeenCalled();
  });

  it('returns the stored response for an identical idempotent replay', async () => {
    const requestHash = createHash('sha256')
      .update(JSON.stringify(validBody))
      .digest('hex');
    mockTransaction.seminarRecordingIdempotency.findUnique.mockResolvedValue({
      requestHash,
      response: { accepted: true },
    });

    const response = await PUT(createRequest(validBody), { params });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ accepted: true });
    expect(
      mockTransaction.seminarRecordingWorkflow.findUnique
    ).not.toHaveBeenCalled();
  });

  it('purges a DELETED workflow after deletion confirmation', async () => {
    const pendingWorkflow = {
      id: 'workflow-001',
      status: 'DELETION_PENDING',
    };
    const deletedWorkflow = {
      id: 'workflow-001',
      bookingId: 'booking-001',
      originalBookingId: 'booking-001',
      participantUserId: 'participant-001',
      recordingId: 'recording-001',
      status: 'DELETED',
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
      deletionRequestedAt: new Date('2026-09-30T10:00:00.000Z'),
      deletionConfirmedAt: new Date('2026-09-30T10:05:00.000Z'),
      deletionReason: 'BOOKING_DELETED',
      lastErrorCode: null,
    };
    mockTransaction.seminarRecordingWorkflow.findUnique
      .mockResolvedValueOnce(pendingWorkflow)
      .mockResolvedValueOnce(deletedWorkflow);
    mockTransaction.seminarRecordingWorkflow.findUniqueOrThrow.mockResolvedValue(
      deletedWorkflow
    );

    const response = await PUT(
      createRequest({
        ...validBody,
        status: 'deleted',
        deletionConfirmedAt: '2026-09-30T10:05:00.000Z',
      }),
      { params }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      purged: true,
      recordingId: 'recording-001',
    });
    expect(mockTransaction.seminarRecordingWorkflow.delete).toHaveBeenCalled();
    expect(
      mockTransaction.seminarRecordingIdempotency.deleteMany
    ).toHaveBeenCalledWith({
      where: { bookingId: 'booking-001', recordingId: 'recording-001' },
    });
    expect(
      mockTransaction.seminarRecordingDeletionOutbox.deleteMany
    ).toHaveBeenCalledWith({
      where: { bookingId: 'booking-001', recordingId: 'recording-001' },
    });
    expect(
      mockTransaction.seminarRecordingIdempotency.create
    ).toHaveBeenCalled();
  });
});
