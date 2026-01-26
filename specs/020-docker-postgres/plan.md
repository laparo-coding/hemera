# Implementation Plan: Local Docker PostgreSQL for Development

**Branch**: `020-docker-postgres` | **Date**: 2026-01-26 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/020-docker-postgres/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path ✅
2. Fill Technical Context ✅
3. Fill Constitution Check section ✅
4. Evaluate Constitution Check ✅ PASS
5. Execute Phase 0 → research.md ✅
6. Execute Phase 1 → contracts, data-model.md, quickstart.md ✅
7. Re-evaluate Constitution Check ✅ PASS
8. Plan Phase 2 → Describe task generation approach ✅
9. STOP - Ready for /tasks command ✅
```

## Summary

Create a Docker Compose configuration to run PostgreSQL 16 locally, matching the production setup.
Provide npm scripts for container lifecycle management (start, stop, reset) and update documentation
to streamline the local development workflow. No database schema changes - infrastructure only.

## Technical Context

**Language/Version**: Docker Compose 3.8+, Bash scripts  
**Primary Dependencies**: Docker Desktop, PostgreSQL 16, Prisma ORM (existing)  
**Storage**: PostgreSQL 16 via Docker container with optional persistent volumes  
**Testing**: Manual validation via `npm run db:status`, existing testcontainers for automated tests  
**Target Platform**: macOS, Linux, Windows (Docker Desktop)  
**Project Type**: Web application (Next.js)  
**Performance Goals**: Container startup < 10 seconds  
**Constraints**: Port 5432 default (configurable), no cloud dependencies for local dev  
**Scale/Scope**: Single developer workflow, no multi-container orchestration

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Requirement | Status | Notes |
|-------------|--------|-------|
| Test-First Development | ✅ N/A | Infrastructure feature, no application code |
| Code Quality & Formatting | ✅ PASS | Shell scripts follow existing patterns |
| Feature Development Workflow | ✅ PASS | Spec created, plan in progress |
| Error Handling & Observability | ✅ N/A | No new error paths in app code |
| Authentication & Security | ✅ N/A | Local dev only, no auth changes |
| Stripe Integration | ✅ N/A | No payment changes |
| Deployment Standards | ✅ PASS | No deployment changes, local tooling only |
| GitHub Actions Workflow | ✅ N/A | No CI/CD modifications |

**Initial Constitution Check**: PASS - Infrastructure-only feature, no constitutional violations.

## Project Structure

### Documentation (this feature)

```
specs/020-docker-postgres/
├── plan.md              # This file
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output (N/A - no data model changes)
├── quickstart.md        # Phase 1 output ✅
├── contracts/           # Phase 1 output (N/A - no API contracts)
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)

```
/                           # Repository root
├── docker-compose.yml      # NEW: PostgreSQL container definition
├── .env.local.example      # UPDATE: Add DATABASE_URL for local Docker
├── package.json            # UPDATE: Add db:docker:* npm scripts
└── docs/ops/
    └── database.md         # UPDATE: Add Docker Compose instructions
```

## Phase 0: Outline & Research ✅

Research completed and documented in [research.md](research.md).

**Key Findings**:
- PostgreSQL 16 is the production version (confirmed)
- No special extensions required
- Existing `docs/ops/database.md` has `docker run` command but no Compose file
- Testcontainers already integrated for automated tests
- Production guard recognizes `localhost` as safe

**Decisions Made**:
| Decision | Rationale |
|----------|-----------|
| Use Docker Compose | Declarative, reproducible, supports volumes and health checks |
| PostgreSQL 16 | Matches production (Neon/Vercel) |
| Named volume for data | Optional persistence across restarts |
| Port 5432 default | Standard PostgreSQL port, matches existing docs |

## Phase 1: Design & Contracts

### Data Model

**N/A** - This feature does not modify the database schema. Uses existing Prisma schema as-is.

### Contracts

**N/A** - This feature does not add or modify API endpoints. Infrastructure tooling only.

### Quickstart

See [quickstart.md](quickstart.md) for developer setup instructions.

### Configuration Files

#### docker-compose.yml (NEW)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    container_name: hemera-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hemera
    ports:
      - "5432:5432"
    volumes:
      - hemera-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d hemera"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  hemera-postgres-data:
```

#### .env.local.example (UPDATE)

Add local Docker database URL:
```bash
# Local Docker PostgreSQL (npm run db:docker:start)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/hemera?schema=hemera
```

#### package.json Scripts (UPDATE)

```json
{
  "scripts": {
    "db:docker:start": "docker compose up -d postgres && echo '✅ PostgreSQL started on localhost:5432'",
    "db:docker:stop": "docker compose stop postgres",
    "db:docker:reset": "docker compose down -v && docker compose up -d postgres && echo '✅ Database reset complete'",
    "db:docker:logs": "docker compose logs -f postgres"
  }
}
```

## Constitution Re-Check (Post-Design)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Test-First Development | ✅ N/A | No testable application code added |
| Code Quality & Formatting | ✅ PASS | YAML follows standard formatting |
| Deployment Standards | ✅ PASS | Local tooling, does not affect deployments |
| Documentation | ✅ PASS | README/docs updated with setup instructions |

**Post-Design Constitution Check**: PASS

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:
1. Create `docker-compose.yml` at repository root
2. Update `package.json` with db:docker:* scripts
3. Update `.env.local.example` with local DATABASE_URL
4. Update `docs/ops/database.md` with Docker Compose instructions
5. Test complete workflow (start → migrate → seed → develop → stop)
6. Update agent context file with new tooling

**Ordering Strategy**:
- Infrastructure first (docker-compose.yml)
- Scripts second (package.json)
- Documentation third (env example, docs)
- Validation last (manual test)

**Estimated Output**: 6-8 ordered tasks in tasks.md

## Complexity Tracking

_No constitutional violations - section not applicable._

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---

_Based on Constitution v2.1.1 - See `.specify/memory/constitution.md`_
