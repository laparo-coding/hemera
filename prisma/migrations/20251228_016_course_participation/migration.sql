-- nosemgrep: tsqllint_set-quoted-identifier - PostgreSQL migration, not SQL Server; QUOTED_IDENTIFIER is T-SQL only
-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('PREPARATION', 'SUMMARY', 'DEBRIEFING', 'RESULTS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "SummaryAssetSource" AS ENUM ('COURSE_DEFAULT', 'BOOKING_OVERRIDE');

-- CreateTable
CREATE TABLE "course_participations" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'PREPARATION',
    "preparation_intent" VARCHAR(2000),
    "desired_results" VARCHAR(2000),
    "line_manager_profile" VARCHAR(2000),
    "preparation_completed_at" TIMESTAMP(3),
    "summary_presented_at" TIMESTAMP(3),
    "summary_asset_source" "SummaryAssetSource",
    "summary_completed_at" TIMESTAMP(3),
    "debriefing_plan" VARCHAR(2000),
    "salary_discussion_month" VARCHAR(7),
    "results_outcome" VARCHAR(2000),
    "results_notes" VARCHAR(2000),
    "results_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participation_documents" (
    "id" TEXT NOT NULL,
    "participation_id" TEXT NOT NULL,
    "blob_url" TEXT NOT NULL,
    "blob_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replaces_document_id" TEXT,
    "replaced_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participation_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_summary_assets" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "mux_asset_id" TEXT NOT NULL,
    "mux_playback_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "available_from" TIMESTAMP(3),
    "available_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_summary_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participation_summary_overrides" (
    "id" TEXT NOT NULL,
    "participation_id" TEXT NOT NULL,
    "course_summary_asset_id" TEXT,
    "mux_asset_id" TEXT,
    "mux_playback_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participation_summary_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_participations_booking_id_key" ON "course_participations"("booking_id");

-- CreateIndex
CREATE INDEX "course_participations_user_id_status_idx" ON "course_participations"("user_id", "status");

-- CreateIndex
CREATE INDEX "participation_documents_participation_id_is_active_idx" ON "participation_documents"("participation_id", "is_active");

-- CreateIndex
CREATE INDEX "course_summary_assets_course_id_is_active_sort_order_idx" ON "course_summary_assets"("course_id", "is_active", "sort_order");

-- CreateIndex
CREATE INDEX "participation_summary_overrides_participation_id_sort_order_idx" ON "participation_summary_overrides"("participation_id", "sort_order");

-- AddForeignKey
ALTER TABLE "course_participations" ADD CONSTRAINT "course_participations_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation_documents" ADD CONSTRAINT "participation_documents_participation_id_fkey" FOREIGN KEY ("participation_id") REFERENCES "course_participations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_summary_assets" ADD CONSTRAINT "course_summary_assets_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation_summary_overrides" ADD CONSTRAINT "participation_summary_overrides_participation_id_fkey" FOREIGN KEY ("participation_id") REFERENCES "course_participations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation_summary_overrides" ADD CONSTRAINT "participation_summary_overrides_course_summary_asset_id_fkey" FOREIGN KEY ("course_summary_asset_id") REFERENCES "course_summary_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
