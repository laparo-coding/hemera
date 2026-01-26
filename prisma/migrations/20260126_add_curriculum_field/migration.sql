-- Add curriculum field to courses table
-- This field stores the structured curriculum data as JSON

ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "curriculum" JSONB;

-- Add comment for documentation
COMMENT ON COLUMN "courses"."curriculum" IS 'Structured curriculum data with modules and topics';
