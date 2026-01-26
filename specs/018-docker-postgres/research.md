# Research: Local Docker PostgreSQL Setup

**Date**: 2026-01-26  
**Feature**: 018-docker-postgres

## Current State Analysis

### Production Database Configuration

| Aspect | Details |
|--------|---------|
| **Provider** | Neon (primary for previews), Vercel Postgres (optional) |
| **PostgreSQL Version** | **16** (documented in `docs/ops/database.md`) |
| **Extensions Required** | None explicitly - Prisma uses standard PostgreSQL features |
| **Schema** | `hemera` (via `?schema=hemera` query parameter) |
| **SSL** | Required for cloud (`sslmode=require`), not for local |

### Existing Docker Setup (documented but incomplete)

From [docs/ops/database.md](../docs/ops/database.md):

```bash
docker run --name hemera-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=hemera \
  -p 5432:5432 \
  -d postgres:16
```

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/hemera?schema=hemera
```

**Gap**: No Docker Compose file, no npm scripts, no persistent volumes documented.

### Testcontainers Already Integrated

The project already uses `@testcontainers/postgresql` for ephemeral test databases:
- Package: `testcontainers: ^11.7.2`, `@testcontainers/postgresql: ^11.11.0`
- Setup: [tests/setup.ts](../tests/setup.ts) automatically starts PostgreSQL 16 container
- Use case: Automated tests when no `DATABASE_URL` is provided

### Production Guard

[lib/db/production-guard.ts](../lib/db/production-guard.ts) recognizes safe local patterns:
- `localhost`, `127.0.0.1`, `::1`, `file:`, `.local`, `postgres:`

## Clarifications Resolved

| Question | Answer |
|----------|--------|
| PostgreSQL version? | **16** (explicit in docs and testcontainers) |
| Extensions required? | **None** - Prisma uses standard features, cuid() is JS-based |
| Persistent volumes? | **Yes** - Should be optional but documented |
| Auto seed? | **Optional** - via `npm run db:seed` |

## Implementation Plan

### 1. Docker Compose File

Create `docker-compose.yml` with:
- PostgreSQL 16 (same as production)
- Named volume for data persistence
- Health check for startup readiness
- Port 5432 exposed

### 2. npm Scripts

Add to `package.json`:
- `db:docker:start` - Start local PostgreSQL container
- `db:docker:stop` - Stop container (preserve data)
- `db:docker:reset` - Remove container and volume (clean slate)
- `db:docker:logs` - View container logs

### 3. Environment Template

Create/update `.env.local.example`:
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/hemera?schema=hemera
```

### 4. Documentation Updates

Update `docs/ops/database.md`:
- Add Docker Compose instructions
- Document npm scripts
- Add troubleshooting for port conflicts

### 5. Production Guard Update

Ensure `localhost:5432` and `docker.internal` are recognized as safe.

## Dependencies

- Docker Desktop or Docker Engine installed
- No new npm packages needed (Docker Compose is standalone)

## Risks

| Risk | Mitigation |
|------|------------|
| Port 5432 conflict | Document how to change port |
| Docker not installed | Clear error message, fallback to cloud DB |
| Data loss on reset | Warn in npm script, require confirmation |

## References

- [Prisma PostgreSQL Docker](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/using-docker-postgresql)
- [Docker Compose PostgreSQL](https://hub.docker.com/_/postgres)
- Existing: [docs/ops/database.md](../docs/ops/database.md)
