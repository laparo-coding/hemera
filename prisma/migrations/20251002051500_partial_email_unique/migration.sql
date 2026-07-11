-- Partial unique index for email where NOT NULL
-- nosemgrep: tsqllint - PostgreSQL migration, not SQL Server; QUOTED_IDENTIFIER is T-SQL only
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON "User" (email) WHERE email IS NOT NULL;
