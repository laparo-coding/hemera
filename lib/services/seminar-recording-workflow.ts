import type { SeminarRecordingWorkflow } from '@prisma/client';

export function serializeWorkflow(workflow: SeminarRecordingWorkflow) {
  return {
    bookingId: workflow.bookingId,
    participantUserId: workflow.participantUserId,
    recordingId: workflow.recordingId,
    status: workflow.status,
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
    transcriptBlobPathname: workflow.transcriptBlobPathname,
    stageAttemptCounts: workflow.stageAttemptCounts as Record<string, number>,
    assemblyAiCleanupStatus: workflow.assemblyAiCleanupStatus,
    sourceBlobCleanupStatus: workflow.sourceBlobCleanupStatus,
    reviewedSpeakerMapping: workflow.reviewedSpeakerMapping as Record<
      string,
      string
    > | null,
    reviewedBy: workflow.reviewedBy,
    reviewedAt: workflow.reviewedAt?.toISOString() ?? null,
    deletionRequestedAt: workflow.deletionRequestedAt?.toISOString() ?? null,
    deletionConfirmedAt: workflow.deletionConfirmedAt?.toISOString() ?? null,
    deletionReason: workflow.deletionReason,
    lastErrorCode: workflow.lastErrorCode,
  };
}
