# Quickstart: Local Docker PostgreSQL

This guide helps developers set up a local PostgreSQL database for Hemera development.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Node.js 20+ with npm

## Quick Setup (2 minutes)

### 1. Start PostgreSQL Container

```bash
npm run db:docker:start
```

This starts a PostgreSQL 16 container with:
- **Container name**: `hemera-postgres`
- **Port**: 5432 (localhost)
- **Database**: `hemera`
- **User/Password**: `postgres`/`postgres`

### 2. Configure Environment

Copy the example environment file (if not already done):

```bash
cp .env.local.example .env.local
```

Verify `DATABASE_URL` is set:

```bash
# .env.local
DATABASE_URL=postgres://postgres:postgres@localhost:5432/hemera?schema=hemera
```

### 3. Run Migrations

```bash
npm run db:migrate
```

### 4. Seed Database (Optional)

```bash
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

## Daily Workflow

| Command | Description |
|---------|-------------|
| `npm run db:docker:start` | Start PostgreSQL container |
| `npm run db:docker:stop` | Stop container (data preserved) |
| `npm run db:docker:reset` | Reset database (data deleted) |
| `npm run db:docker:logs` | View container logs |
| `npm run db:status` | Check migration status |

## Troubleshooting

### Port 5432 Already in Use

Another PostgreSQL instance is running. Either:
- Stop the other instance, or
- Change the port in `docker-compose.yml`:
  ```yaml
  ports:
    - "5433:5432"  # Use 5433 instead
  ```
  Update `.env.local` accordingly:
  ```bash
  DATABASE_URL=postgres://postgres:postgres@localhost:5433/hemera?schema=hemera
  ```

### Docker Not Running

```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker
```

### Container Won't Start

Check logs:
```bash
npm run db:docker:logs
```

Reset completely:
```bash
npm run db:docker:reset
```

### Migration Fails

Ensure container is healthy:
```bash
docker ps  # Should show "healthy" status
```

Wait a few seconds after container start, then retry.

## Switching Between Local and Remote Database

To use a remote database (Neon, Vercel Postgres):

1. Update `DATABASE_URL` in `.env.local` with the remote connection string
2. Stop local container: `npm run db:docker:stop`
3. Run migrations against remote: `npm run db:deploy`

To switch back to local:

1. Restore local `DATABASE_URL` in `.env.local`
2. Start container: `npm run db:docker:start`

## Verification

After setup, verify everything works:

```bash
# Check database connection
npm run db:status

# Expected output:
# Database connection is healthy
# Migrations are up to date
```

## Next Steps

- Run the test suite: `npm test`
- Start the dev server: `npm run dev`
- View courses at http://localhost:3000/academy
