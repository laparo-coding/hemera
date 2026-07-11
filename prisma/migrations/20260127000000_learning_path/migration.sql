-- nosemgrep: tsqllint_set-quoted-identifier - PostgreSQL migration, not SQL Server; QUOTED_IDENTIFIER is T-SQL only
-- Learning Path Feature (021)
-- Adds recommendation fields to Course, outperformer flag to User,
-- PRE_BOOKED status to PaymentStatus, and review fields to Booking

-- Add PRE_BOOKED to PaymentStatus enum
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PRE_BOOKED' AFTER 'PENDING';

-- Add Learning Path fields to courses table
ALTER TABLE "courses" 
  ADD COLUMN IF NOT EXISTS "recommended" VARCHAR(300),
  ADD COLUMN IF NOT EXISTS "not_recommended" VARCHAR(300),
  ADD COLUMN IF NOT EXISTS "is_non_public" BOOLEAN NOT NULL DEFAULT false;

-- Add isOutperformer field to users table
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "is_outperformer" BOOLEAN NOT NULL DEFAULT false;

-- Add review fields to bookings table
ALTER TABLE "bookings" 
  ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT;
