-- CreateEnum
CREATE TYPE "NameDisplayFormat" AS ENUM ('FULL_NAME_CITY', 'FULL_NAME', 'FIRST_INITIAL', 'FIRST_NAME_ONLY');

-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'HIDDEN');

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "statement" VARCHAR(1000) NOT NULL,
    "name_display_format" "NameDisplayFormat" NOT NULL,
    "cached_display_name" TEXT NOT NULL,
    "cached_photo_url" TEXT,
    "cached_city" TEXT,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "testimonials_booking_id_key" ON "testimonials"("booking_id");

-- CreateIndex
CREATE INDEX "testimonials_course_id_status_idx" ON "testimonials"("course_id", "status");

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
