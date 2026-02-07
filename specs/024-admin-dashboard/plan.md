# Implementation Plan: Admin Dashboard Redesign

**Branch**: `024-admin-dashboard` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-admin-dashboard/spec.md`

## Execution Flow (/plan command scope)

```
1. ✅ Load feature spec from Input path
2. ✅ Fill Technical Context
3. ✅ Fill Constitution Check section
4. ✅ Evaluate Constitution Check
5. ⏳ Execute Phase 0 → research.md
6. ⏳ Execute Phase 1 → contracts, data-model.md, quickstart.md
7. ⏳ Re-evaluate Constitution Check
8. ⏳ Plan Phase 2 → Describe task generation approach
9. ⏳ STOP - Ready for /tasks command
```

## Summary

Überarbeitung des Admin Dashboards mit:
- Einheitlichem Layout (Standardbreite 1280px für alle Admin-Seiten)
- Breadcrumb-Navigation auf allen Unterseiten
- 3-Spalten-Grid mit 6 Dashboard-Karten
- Neue Bereiche: Benutzerverwaltung (Clerk-Daten + Outperformer), Berichte & Analysen (Health + Stats)
- Kurs-Veröffentlichungs-Toggle statt separater Status-Spalte/Button
- Standortverwaltung Layout-Angleichung (Suche entfernen)
- Deutsche Lokalisierung aller Texte
- Footer und Willkommensnachricht entfernen

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16 (App Router), React 19
**Primary Dependencies**: Material-UI v5, Clerk SDK, Prisma ORM
**Storage**: PostgreSQL via Prisma
**Testing**: Jest (unit/contract), Playwright (E2E)
**Target Platform**: Web (Vercel deployment)
**Project Type**: Web (Next.js monorepo with app/ structure)
**Performance Goals**: <200ms page load, responsive UI
**Constraints**: German localization, Admin-only access via Clerk roles
**Scale/Scope**: ~10 Admin-Seiten, 6 Dashboard-Karten, 4 neue API-Endpoints

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Rule | Status | Notes |
|------|--------|-------|
| German Language (informal "Du") | ✅ PASS | Spec requires German localization |
| Rollbar Error Logging | ✅ PASS | Will use existing monitoring infrastructure |
| GitHub Actions Deployment | ✅ PASS | No deployment changes needed |
| Stripe Integration | N/A | No payment features in this spec |
| Error Handling | ✅ PLAN | API endpoints will follow existing patterns |
| Test Coverage | ✅ PLAN | Contract tests for new APIs, E2E for UI |

## Project Structure

### Documentation (this feature)

```
specs/024-admin-dashboard/
├── plan.md              # This file
├── spec.md              # Feature specification ✅
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── admin-users-api.yaml
│   ├── admin-reports-api.yaml
│   └── admin-courses-api.yaml
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)

```
app/admin/
├── layout.tsx                    # MODIFY: Add breadcrumb, remove footer
├── page.tsx                      # MODIFY: 3-column grid, 6 cards, German
├── users/
│   └── page.tsx                  # NEW: Clerk user list with Outperformer
├── reports/
│   └── page.tsx                  # NEW: Health status + statistics
├── courses/
│   └── page.tsx                  # MODIFY: Toggle instead of status column
└── locations/
    └── page.tsx                  # MODIFY: Remove search, align layout

components/admin/
├── AdminBreadcrumb.tsx           # NEW: Breadcrumb navigation
├── AdminPageContainer.tsx        # NEW: Wrapper with head space
├── DashboardCard.tsx             # NEW: Card component for dashboard
├── UserList.tsx                  # NEW: Clerk user table
├── ReportsPanel.tsx              # NEW: Health + stats display
└── CourseListWithDelete.tsx      # MODIFY: Replace status with toggle

lib/
├── constants/admin.ts            # NEW: Layout constants
└── api/
    ├── admin-users.ts            # NEW: Clerk user fetching
    └── admin-reports.ts          # NEW: Statistics aggregation

app/api/admin/
├── users/
│   └── route.ts                  # NEW: List users with outperformer
└── reports/
    └── route.ts                  # NEW: Booking/course/user stats
```

**Structure Decision**: Extend existing app/admin/ structure with new routes and components

## Phase 0: Outline & Research

### Research Tasks

1. **Clerk Admin SDK** - Best practices for listing all users server-side
2. **MUI Breadcrumb** - Component patterns and accessibility
3. **MUI Switch vs Toggle** - Best component for publish toggle
4. **Statistics Aggregation** - Prisma queries for booking/course/user counts

### Findings

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot` **IMPORTANT**: Execute it exactly
     as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented (none required) ✅

**Generated Artifacts**:
- `research.md` - Technology decisions and patterns
- `data-model.md` - View models and existing entity usage
- `contracts/admin-users-api.yaml` - User management API contract
- `contracts/admin-reports-api.yaml` - Reports/stats API contract
- `quickstart.md` - Validation guide and DoD checklist
- `.github/copilot-instructions.md` - Updated with 024 tech stack

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
