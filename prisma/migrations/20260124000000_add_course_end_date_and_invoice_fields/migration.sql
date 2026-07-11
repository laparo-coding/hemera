-- nosemgrep: tsqllint_set-quoted-identifier - PostgreSQL migration, not SQL Server; QUOTED_IDENTIFIER is T-SQL only
-- AlterTable: Add endDate to courses for multi-day course support
ALTER TABLE "courses" ADD COLUMN "end_date" TIMESTAMP(3);

-- AlterTable: Add Stripe invoice fields to bookings
ALTER TABLE "bookings" ADD COLUMN "stripe_invoice_id" TEXT;
ALTER TABLE "bookings" ADD COLUMN "stripe_invoice_url" TEXT;
ALTER TABLE "bookings" ADD COLUMN "stripe_invoice_pdf_url" TEXT;
