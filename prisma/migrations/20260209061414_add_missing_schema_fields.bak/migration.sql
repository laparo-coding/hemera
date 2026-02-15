-- AlterTable: Add image fields to courses
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "image_detail" TEXT;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "image_twitter" TEXT;

-- AlterTable: Fix users constraint name if needed
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_pkey') THEN
    ALTER TABLE "users" RENAME CONSTRAINT "User_pkey" TO "users_pkey";
  END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;

-- Drop legacy tables if they exist
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "verification_tokens" CASCADE;

-- CreateTable
CREATE TABLE "seminar_materials" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blob_url" TEXT NOT NULL,
    "blob_pathname" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seminar_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_topic_materials" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_topic_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seminar_materials_identifier_key" ON "seminar_materials"("identifier");

-- CreateIndex
CREATE INDEX "curriculum_topic_materials_course_id_topic_id_idx" ON "curriculum_topic_materials"("course_id", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_topic_materials_course_id_topic_id_material_id_key" ON "curriculum_topic_materials"("course_id", "topic_id", "material_id");

-- RenameForeignKey (safe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_courseId_fkey') THEN
    ALTER TABLE "bookings" RENAME CONSTRAINT "bookings_courseId_fkey" TO "bookings_course_id_fkey";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_userId_fkey') THEN
    ALTER TABLE "bookings" RENAME CONSTRAINT "bookings_userId_fkey" TO "bookings_user_id_fkey";
  END IF;
END $$;

-- AddForeignKey
ALTER TABLE "curriculum_topic_materials" ADD CONSTRAINT "curriculum_topic_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "seminar_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
