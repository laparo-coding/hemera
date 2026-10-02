-- CreateEnum
CREATE TYPE "SeminarRecordingWorkflowStatus" AS ENUM ('QUEUED', 'TRANSCRIBING', 'TRANSCRIPT_READY', 'REVIEW_REQUIRED', 'PUBLISHING', 'READY', 'RETRYABLE_FAILURE', 'FAILED', 'DELETION_PENDING', 'DELETED');

-- CreateEnum
CREATE TYPE "ProviderCleanupStatus" AS ENUM ('PENDING', 'COMPLETE', 'RETRYABLE_FAILURE', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "WorkflowDeletionReason" AS ENUM ('BOOKING_DELETED', 'PARTICIPATION_DELETED', 'OPERATOR_ABANDONED');

-- CreateTable
CREATE TABLE "seminar_recording_workflows" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT,
    "participant_user_id" TEXT NOT NULL,
    "recording_id" TEXT NOT NULL,
    "status" "SeminarRecordingWorkflowStatus" NOT NULL DEFAULT 'QUEUED',
    "recording_date" TIMESTAMP(3) NOT NULL,
    "queued_at" TIMESTAMP(3) NOT NULL,
    "first_provider_attempt_at" TIMESTAMP(3),
    "assembly_ai_transcript_id" TEXT,
    "assembly_ai_status" TEXT,
    "source_blob_pathname" TEXT,
    "mux_asset_id" TEXT,
    "mux_playback_id" TEXT,
    "mux_playback_url" TEXT,
    "transcript_blob_pathname" TEXT,
    "stage_attempt_counts" JSONB NOT NULL DEFAULT '{}',
    "assembly_ai_cleanup_status" "ProviderCleanupStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "source_blob_cleanup_status" "ProviderCleanupStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "reviewed_speaker_mapping" JSONB,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "deletion_requested_at" TIMESTAMP(3),
    "deletion_confirmed_at" TIMESTAMP(3),
    "deletion_reason" "WorkflowDeletionReason",
    "last_error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seminar_recording_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seminar_recording_trace_events" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT,
    "provider_reference" TEXT,
    "error_code" TEXT,
    "operator_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seminar_recording_trace_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seminar_recording_idempotency" (
    "booking_id" TEXT NOT NULL,
    "recording_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seminar_recording_idempotency_pkey" PRIMARY KEY ("booking_id", "recording_id", "idempotency_key")
);

-- CreateIndex
CREATE INDEX "seminar_recording_workflows_status_queued_at_idx" ON "seminar_recording_workflows"("status", "queued_at");

-- CreateIndex
CREATE INDEX "seminar_recording_workflows_participant_user_id_idx" ON "seminar_recording_workflows"("participant_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "seminar_recording_workflows_booking_id_recording_id_key" ON "seminar_recording_workflows"("booking_id", "recording_id");

-- CreateIndex
CREATE INDEX "seminar_recording_trace_events_workflow_id_occurred_at_idx" ON "seminar_recording_trace_events"("workflow_id", "occurred_at");

-- CreateIndex

-- AddForeignKey
ALTER TABLE "seminar_recording_workflows" ADD CONSTRAINT "seminar_recording_workflows_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seminar_recording_trace_events" ADD CONSTRAINT "seminar_recording_trace_events_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "seminar_recording_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
