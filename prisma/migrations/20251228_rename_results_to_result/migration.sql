-- nosemgrep: tsqllint_set-quoted-identifier - PostgreSQL migration, not SQL Server; QUOTED_IDENTIFIER is T-SQL only
-- Rename 'results' to 'result' in ParticipationStatus enum and CourseParticipation columns

-- Step 1: Rename enum value RESULTS to RESULT
ALTER TYPE "ParticipationStatus" RENAME VALUE 'RESULTS' TO 'RESULT';

-- Step 2: Rename columns in course_participations table
ALTER TABLE "course_participations" RENAME COLUMN "results_outcome" TO "result_outcome";
ALTER TABLE "course_participations" RENAME COLUMN "results_notes" TO "result_notes";
ALTER TABLE "course_participations" RENAME COLUMN "results_completed_at" TO "result_completed_at";
