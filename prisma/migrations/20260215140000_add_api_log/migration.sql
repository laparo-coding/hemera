-- CreateApiLog table
CREATE TABLE IF NOT EXISTS "ApiLog" (
  "id" TEXT PRIMARY KEY,
  "service_user_id" TEXT,
  "endpoint" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "response_status" INTEGER,
  "ip_address" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "apilog_service_user_id_timestamp_idx" ON "ApiLog"("service_user_id", "timestamp");
