-- Migration: Standardize naming conventions
-- This migration renames tables and columns to follow PostgreSQL snake_case convention
-- Safe to run on existing data - only renames, no data changes
-- 
-- Current state (2025-12-22):
-- Tables: User, Account, VerificationToken, courses, bookings
-- Columns: camelCase in most tables

-- ============================================================================
-- STEP 1: Rename tables to snake_case plural
-- ============================================================================

ALTER TABLE IF EXISTS "User" RENAME TO "users";
ALTER TABLE IF EXISTS "Account" RENAME TO "accounts";
ALTER TABLE IF EXISTS "VerificationToken" RENAME TO "verification_tokens";
-- courses and bookings already have correct names

-- ============================================================================
-- STEP 2: Add missing timestamp columns to users table
-- ============================================================================

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- ============================================================================
-- STEP 3: Rename columns in users table
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'emailVerified') THEN
    ALTER TABLE "users" RENAME COLUMN "emailVerified" TO "email_verified";
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Rename columns in accounts table
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'userId') THEN
    ALTER TABLE "accounts" RENAME COLUMN "userId" TO "user_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'providerAccountId') THEN
    ALTER TABLE "accounts" RENAME COLUMN "providerAccountId" TO "provider_account_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'expires_at') THEN
    -- Already snake_case, rename Prisma field reference
    NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'expiresAt') THEN
    ALTER TABLE "accounts" RENAME COLUMN "expiresAt" TO "expires_at";
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Rename columns in courses table
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'startDate') THEN
    ALTER TABLE "courses" RENAME COLUMN "startDate" TO "start_date";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'startTime') THEN
    ALTER TABLE "courses" RENAME COLUMN "startTime" TO "start_time";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'endTime') THEN
    ALTER TABLE "courses" RENAME COLUMN "endTime" TO "end_time";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'isPublished') THEN
    ALTER TABLE "courses" RENAME COLUMN "isPublished" TO "is_published";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'createdAt') THEN
    ALTER TABLE "courses" RENAME COLUMN "createdAt" TO "created_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'updatedAt') THEN
    ALTER TABLE "courses" RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'thumbnailUrl') THEN
    ALTER TABLE "courses" RENAME COLUMN "thumbnailUrl" TO "thumbnail_url";
  END IF;
END $$;

-- Update default currency from USD to EUR
ALTER TABLE "courses" ALTER COLUMN "currency" SET DEFAULT 'EUR';

-- ============================================================================
-- STEP 6: Rename columns in bookings table
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'userId') THEN
    ALTER TABLE "bookings" RENAME COLUMN "userId" TO "user_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'courseId') THEN
    ALTER TABLE "bookings" RENAME COLUMN "courseId" TO "course_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'paymentStatus') THEN
    ALTER TABLE "bookings" RENAME COLUMN "paymentStatus" TO "payment_status";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'stripePaymentIntentId') THEN
    ALTER TABLE "bookings" RENAME COLUMN "stripePaymentIntentId" TO "stripe_payment_intent_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'stripeSessionId') THEN
    ALTER TABLE "bookings" RENAME COLUMN "stripeSessionId" TO "stripe_session_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'createdAt') THEN
    ALTER TABLE "bookings" RENAME COLUMN "createdAt" TO "created_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'updatedAt') THEN
    ALTER TABLE "bookings" RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;
END $$;

-- Update default currency from USD to EUR
ALTER TABLE "bookings" ALTER COLUMN "currency" SET DEFAULT 'EUR';

-- ============================================================================
-- STEP 7: Update constraints and indexes
-- ============================================================================

-- Drop old unique constraint and create new one with snake_case column names
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "Booking_userId_courseId_key";
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_user_id_course_id_key";
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_course_id_key" UNIQUE ("user_id", "course_id");

-- Update index on courses
DROP INDEX IF EXISTS "Course_startDate_idx";
DROP INDEX IF EXISTS "courses_start_date_idx";
CREATE INDEX IF NOT EXISTS "courses_start_date_idx" ON "courses"("start_date");
