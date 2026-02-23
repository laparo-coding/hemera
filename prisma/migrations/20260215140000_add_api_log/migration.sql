-- Create api_logs table
CREATE TABLE IF NOT EXISTS "api_logs" (
  "id" TEXT PRIMARY KEY,
  "service_user_id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "response_status" INTEGER NOT NULL,
  "ip_address" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "api_logs_service_user_id_created_at_idx" ON "api_logs"("service_user_id", "created_at");
