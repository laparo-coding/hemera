-- Add missing fields for 018-user-dashboard
-- Course endDate field for multi-day courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS end_date TIMESTAMP;

-- Stripe invoice fields for booking receipts
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_invoice_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_invoice_pdf_url TEXT;
