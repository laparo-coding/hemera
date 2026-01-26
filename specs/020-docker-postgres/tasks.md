# Tasks: Local Docker PostgreSQL for Development

**Input**: Design documents from `/specs/020-docker-postgres/`  
**Prerequisites**: plan.md ✅, research.md ✅, quickstart.md ✅

## Execution Flow (main)

```
1. Load plan.md ✅
   → Tech stack: Docker Compose 3.8+, PostgreSQL 16, Bash
   → Structure: Infrastructure-only, no app code changes
2. Load optional design documents:
   → data-model.md: N/A (no entities)
   → contracts/: N/A (no API endpoints)
   → research.md: ✅ Decisions extracted
   → quickstart.md: ✅ Validation scenarios extracted
3. Generate tasks by category:
   → Setup: docker-compose.yml, npm scripts
   → Documentation: .env.local.example, docs/ops/database.md
   → Validation: Manual workflow test
4. Apply task rules:
   → T001-T003 sequential (shared files/dependencies)
   → T004-T005 parallel [P] (independent doc files)
   → T006 sequential (depends on all above)
5. SUCCESS: 7 tasks ready for execution
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All paths are absolute from repository root

## Phase 3.1: Infrastructure Setup

- [x] T001 Create `docker-compose.yml` at repository root with PostgreSQL 16 configuration
  - File: `/docker-compose.yml`
  - Content: PostgreSQL 16 service with health check, named volume, port 5432
  - Reference: plan.md "Configuration Files" section

- [x] T002 Add npm scripts for Docker database management to `package.json`
  - File: `/package.json`
  - Scripts to add:
    - `db:docker:start`: Start PostgreSQL container
    - `db:docker:stop`: Stop container (preserve data)
    - `db:docker:reset`: Reset container and volume
    - `db:docker:logs`: View container logs
  - Reference: plan.md "package.json Scripts" section

## Phase 3.2: Documentation Updates

- [x] T003 [P] Update `.env.local.example` with local Docker DATABASE_URL
  - File: `/.env.local.example` (create if not exists)
  - Add: `DATABASE_URL=postgres://postgres:postgres@localhost:5432/hemera?schema=hemera`
  - Add comment explaining this is for local Docker PostgreSQL

- [x] T004 [P] Update `docs/ops/database.md` to document Docker Compose workflow
  - File: `/docs/ops/database.md`
  - Replace "Option C — Lokal per Docker" section with Docker Compose instructions
  - Add npm script commands
  - Keep existing troubleshooting section, add port conflict resolution

## Phase 3.3: Agent Context Update

- [x] T005 Update agent context file with new Docker tooling
  - Run: `.specify/scripts/bash/update-agent-context.sh copilot`
  - Verify `.github/copilot-instructions.md` includes Docker Compose info

## Phase 3.4: Validation

- [ ] T006 Validate complete workflow manually
  - Prerequisites: Docker Desktop running
  - **SKIPPED**: Docker Desktop not installed on this machine
  - Steps documented in quickstart.md for manual validation when Docker is available

- [x] T007 Add `docker-compose.yml` to `.gitignore` exceptions (if needed)
  - File: `/.gitignore`
  - Verify docker-compose.yml is NOT ignored (should be committed)
  - Verify `hemera-postgres-data` volume is not in repo (Docker manages it)

## Dependencies

```
T001 (docker-compose.yml) ──┬──> T002 (npm scripts)
                           │
                           └──> T003 (.env.local.example) ─┐
                                                           ├──> T005 (agent context)
                           └──> T004 (docs/database.md) ───┘
                                                           │
                                                           v
                                                      T006 (validation)
                                                           │
                                                           v
                                                      T007 (gitignore check)
```

## Parallel Execution Example

```bash
# After T001 and T002 complete, run T003-T004 in parallel:
# Terminal 1:
Task: "Update .env.local.example with local Docker DATABASE_URL"

# Terminal 2:
Task: "Update docs/ops/database.md to document Docker Compose workflow"
```

## Notes

- **No TDD phase**: Infrastructure-only feature, no application code to test
- **No contract tests**: No API endpoints added
- **Validation is manual**: Docker container lifecycle cannot be automated in unit tests
- Commit after each task for clean git history
- T006 requires Docker Desktop running locally

## Validation Checklist

_GATE: Checked before marking complete_

- [ ] docker-compose.yml creates working PostgreSQL 16 container
- [ ] All npm scripts execute without errors
- [ ] .env.local.example contains correct DATABASE_URL
- [ ] docs/ops/database.md reflects new Docker Compose workflow
- [ ] Complete workflow (start → migrate → seed → stop → restart) works
- [ ] Data persists across container restarts
- [ ] Reset command clears all data

---

_Generated from plan.md and quickstart.md on 2026-01-26_
