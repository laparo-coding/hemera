-- Conversion of CourseMaterial.type field from TEXT to enum
-- Feature: 026-course-material-integration
-- 
-- This migration converts the existing STRING type field to the CourseMaterialType
-- enum, ensuring type safety and data consistency. Valid values: CONTENT, SLIDE_CONTROL

-- Step 1: Create the enum type with valid values
CREATE TYPE "CourseMaterialType" AS ENUM ('CONTENT', 'SLIDE_CONTROL');

-- Step 2: Alter the column to use the new enum type
-- Cast ensures all existing TEXT values are converted to their enum equivalents
ALTER TABLE "seminar_materials"
  ALTER COLUMN "type" TYPE "CourseMaterialType"
  USING "type"::"CourseMaterialType";

-- Step 3: Set the default value for the enum column (was already CONTENT string)
ALTER TABLE "seminar_materials"
  ALTER COLUMN "type" SET DEFAULT 'CONTENT';
