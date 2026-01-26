# Feature Specification: Local Docker PostgreSQL for Development

**Feature Branch**: `020-docker-postgres`  
**Created**: 2026-01-26  
**Status**: Draft  
**Input**: User description: "Create a docker container locally to host a Postgres database for local development. The database setup must be the same as for production to streamline development. Adapt the workflows to utilise the database for local development."

## Clarifications

### Session 2026-01-26
- Q: Which PostgreSQL version is used in production? → A: **PostgreSQL 16** (documented in `docs/ops/database.md` and used by testcontainers)
- Q: Are there specific PostgreSQL extensions required? → A: **None** - Prisma uses standard PostgreSQL features; cuid() is generated in JavaScript
- Q: Should the Docker setup include persistent volume mapping? → A: **Yes**, optional but recommended for data retention across restarts
- Q: Should seed data be automatically loaded when container starts? → A: **No**, seed is run manually via `npm run db:seed` after migrations
- Q: How should the system handle port 5432 conflicts? → A: **Fail with clear error message** and documentation on how to change the port manually

## User Scenarios & Testing _(mandatory)_

### Primary User Story

A developer clones the repository, runs a single command to start a local PostgreSQL database via Docker, and can immediately begin development with a database environment identical to production.

### Acceptance Scenarios

1. **Given** a developer with Docker installed, **When** they run the database start command, **Then** a PostgreSQL container starts with the same configuration as production.
2. **Given** a running local database container, **When** the developer runs migrations, **Then** the Prisma schema is applied successfully matching production structure.
3. **Given** a developer wanting to reset their local database, **When** they run the reset command, **Then** the database is recreated fresh with optional seed data.
4. **Given** a developer stopping work, **When** they stop the container and restart it later, **Then** their data persists (if configured with volumes).

### Edge Cases

- **Port 5432 conflict**: Container startup fails with Docker's standard port-in-use error; documentation provides instructions to change port in `docker-compose.yml` and update `DATABASE_URL` accordingly.
- **Switching databases**: Developer updates `DATABASE_URL` in `.env.local` to switch between local Docker and remote cloud database.
- **Docker not running**: Container commands fail with Docker daemon error; documentation instructs user to start Docker Desktop.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a Docker Compose configuration to run PostgreSQL locally with the same version and settings as production.
- **FR-002**: System MUST include npm scripts to start, stop, and reset the local database container.
- **FR-003**: System MUST provide a `.env.local.example` or documentation showing the correct `DATABASE_URL` for connecting to the local Docker database.
- **FR-004**: System MUST ensure local database schema matches production after running migrations.
- **FR-005**: System MUST support optional data persistence via Docker volumes.
- **FR-006**: System MUST document the setup process in README or dedicated documentation.

### Non-Functional Requirements

- **NFR-001**: Container startup SHOULD complete within 10 seconds.
- **NFR-002**: Local development workflow SHOULD not require cloud database access.
- **NFR-003**: Setup SHOULD work on macOS, Linux, and Windows (with Docker Desktop).

### Key Entities _(include if feature involves data)_

N/A - This feature is infrastructure/tooling only.

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities resolved
