/*
  Warnings:

  - You are about to drop the column `date` on the `courses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[identifier,token]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.
  - Made the column `capacity` on table `courses` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "date",
ADD COLUMN     "instructor" TEXT NOT NULL DEFAULT 'TBD',
ADD COLUMN     "level" "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "thumbnailUrl" TEXT,
ALTER COLUMN "capacity" SET NOT NULL,
ALTER COLUMN "capacity" SET DEFAULT 20;

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "courses_startDate_idx" ON "courses"("startDate");
