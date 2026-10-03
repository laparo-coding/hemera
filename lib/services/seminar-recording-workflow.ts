import type { SeminarRecordingWorkflow } from '@prisma/client';

// Prisma enum values are UPPERCASE; the Aither contract
// (specs/012-video-transcription/contracts/seminar-recording-api.openapi.yaml)
// uses lowercase snake_case statuses. Map at the API boundary in both
// directions: serializeWorkflow converts to the wire format, and the route
// handlers convert incoming wire values back to Prisma values.
const STATUS_TO_WIRE: Record<SeminarRecordingWorkflow['status'], string> = {
  QUEUED: 'queued',
  TRANSCRIBING: 'transcribing',
  TRANSCRIPT_READY: 'transcript_ready',
  REVIEW_REQUIRED: 'review_required',
  PUBLISHING: 'publishing',
  READY: 'ready',
  RETRYABLE_FAILURE: 'retryable_failure',
  FAILED: 'failed',
  DELETION_PENDING: 'deletion_pending',
  DELETED: 'deleted',
};

const WIRE_TO_STATUS = Object.fromEntries(
  Object.entries(STATUS_TO_WIRE).map(([prismaStatus, wire]) => [
    wire,
    prismaStatus as SeminarRecordingWorkflow['status'],
  ])
) as Record<string, SeminarRecordingWorkflow['status']>;

export function toWireStatus(
  status: SeminarRecordingWorkflow['status']
): string {
  return STATUS_TO_WIRE[status];
}

export function fromWireStatus(
  wire: string
): SeminarRecordingWorkflow['status'] | undefined {
  return WIRE_TO_STATUS[wire];
}

const CLEANUP_TO_WIRE = {
  PENDING: 'pending',
  COMPLETE: 'complete',
  RETRYABLE_FAILURE: 'retryable_failure',
  NOT_REQUIRED: 'not_required',
} as const;

const DELETION_REASON_TO_WIRE = {
  BOOKING_DELETED: 'booking_deleted',
  PARTICIPATION_DELETED: 'participation_deleted',
  OPERATOR_ABANDONED: 'operator_abandoned',
} as const;

export function serializeWorkflow(workflow: SeminarRecordingWorkflow) {
  return {
    bookingId: workflow.originalBookingId,
    participantUserId: workflow.participantUserId,
    recordingId: workflow.recordingId,
    status: toWireStatus(workflow.status),
    recordingDate: workflow.recordingDate.toISOString(),
    queuedAt: workflow.queuedAt.toISOString(),
    firstProviderAttemptAt:
      workflow.firstProviderAttemptAt?.toISOString() ?? null,
    assemblyAiTranscriptId: workflow.assemblyAiTranscriptId,
    assemblyAiStatus: workflow.assemblyAiStatus,
    sourceBlobPathname: workflow.sourceBlobPathname,
    muxAssetId: workflow.muxAssetId,
    muxPlaybackId: workflow.muxPlaybackId,
    muxPlaybackUrl: workflow.muxPlaybackUrl,
    durationSeconds: workflow.durationSeconds,
    transcriptBlobPathname: workflow.transcriptBlobPathname,
    stageAttemptCounts: workflow.stageAttemptCounts as Record<string, number>,
    nextAttemptAt: workflow.nextAttemptAt?.toISOString() ?? null,
    assemblyAiCleanupStatus: CLEANUP_TO_WIRE[workflow.assemblyAiCleanupStatus],
    sourceBlobCleanupStatus: CLEANUP_TO_WIRE[workflow.sourceBlobCleanupStatus],
    reviewedSpeakerMapping: workflow.reviewedSpeakerMapping as Record<
      string,
      string
    > | null,
    reviewedBy: workflow.reviewedBy,
    reviewedAt: workflow.reviewedAt?.toISOString() ?? null,
    deletionRequestedAt: workflow.deletionRequestedAt?.toISOString() ?? null,
    deletionConfirmedAt: workflow.deletionConfirmedAt?.toISOString() ?? null,
    deletionReason: workflow.deletionReason
      ? DELETION_REASON_TO_WIRE[workflow.deletionReason]
      : null,
    lastErrorCode: workflow.lastErrorCode,
  };
}
