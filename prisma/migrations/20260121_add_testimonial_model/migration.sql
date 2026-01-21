-- Migration: Add Testimonial model (017-testimonial-management)
-- This migration updates the testimonials table to the new schema

-- DropForeignKey (if exists)
ALTER TABLE "testimonials" DROP CONSTRAINT IF EXISTS "testimonials_booking_id_fkey";

-- DropIndex (if exists)
DROP INDEX IF EXISTS "testimonials_booking_id_key";
DROP INDEX IF EXISTS "testimonials_course_id_status_idx";

-- AlterTable: Remove old columns, add new ones
ALTER TABLE "testimonials" 
DROP COLUMN IF EXISTS "booking_id",
DROP COLUMN IF EXISTS "cached_city",
DROP COLUMN IF EXISTS "cached_display_name",
DROP COLUMN IF EXISTS "cached_photo_url",
DROP COLUMN IF EXISTS "name_display_format",
DROP COLUMN IF EXISTS "statement",
DROP COLUMN IF EXISTS "status",
ADD COLUMN IF NOT EXISTS "author_image" TEXT,
ADD COLUMN IF NOT EXISTS "author_name" TEXT NOT NULL DEFAULT 'Anonym',
ADD COLUMN IF NOT EXISTS "author_role" TEXT,
ADD COLUMN IF NOT EXISTS "content" VARCHAR(2000) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "rating" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS "user_id" TEXT;

-- Remove defaults after adding columns
ALTER TABLE "testimonials" 
ALTER COLUMN "author_name" DROP DEFAULT,
ALTER COLUMN "content" DROP DEFAULT;

-- DropEnum (if exists)
DROP TYPE IF EXISTS "NameDisplayFormat";
DROP TYPE IF EXISTS "TestimonialStatus";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "testimonials_course_id_is_published_idx" ON "testimonials"("course_id", "is_published");
CREATE INDEX IF NOT EXISTS "testimonials_user_id_idx" ON "testimonials"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "testimonials_course_id_user_id_key" ON "testimonials"("course_id", "user_id");

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
