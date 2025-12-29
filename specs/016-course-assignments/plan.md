# Implementation Plan: Course Assignments Participation Flow

**Branch**: `016-course-assignments` | **Date**: 2025-12-28 | **Spec**: [specs/016-course-assignments/spec.md](specs/016-course-assignments/spec.md) **Input**: Feature specification from `specs/016-course-assignments/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Deliver a guided course participation workspace that separates Preparation, Summary, Debriefing, and Results for each booking. Persist participant inputs, résumé metadata, and summary viewing state while sourcing summary videos from Mux and hiding that step when no assets exist. Design focuses on Prisma-backed course participation records, file management for résumés, and Mux asset mapping (course defaults with booking overrides).

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15.5.6 (App Router)  
**Primary Dependencies**: React 18, Material-UI v5, Clerk auth, Prisma ORM, Mux video SDK/API, Rollbar monitoring  
**Storage**: PostgreSQL via Prisma models (course participation, documents, summary assets)  
**Testing**: Jest + React Testing Library for units, Playwright for E2E where applicable  
**Target Platform**: Web (Next.js SSR + client transitions) **Project Type**: web  
**Performance Goals**: Respect Lighthouse budgets (FCP < 1.8s, LCP < 2.5s, CLS < 0.1) and maintain responsive dashboard interactions  
**Constraints**: Must follow TDD (contract tests first), enforce Clerk role access, hide summary step when no Mux assets, Rollbar for error logging, résumé uploads as single active file  
**Scale/Scope**: Applies to all booked participants; must support multiple concurrent courses per user without data leakage

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Test-First Development (I)**: Plan mandates contract tests and unit tests ahead of implementation; no code without failing tests. Status: PASS (will document in Phase 1 output).
- **Code Quality & Formatting (II)**: Ensure ESLint/Prettier compliance and strict TypeScript usage; plan includes lint-safe patterns. Status: PASS.
- **Feature Workflow (III)**: Spec-first process already followed; plan includes contract definition, Prisma migration strategy, Clerk integration, and Mux asset handling. Status: PASS.
- **Holistic Error Handling & Observability (VI)**: Any new server logic must use Rollbar logging helpers and structured context; plan will document patterns. Status: PASS.
- **Authentication & Security (IV)**: Access control must enforce participant/instructor/admin roles via Clerk middleware/selectors; plan outlines authorization checks. Status: PASS.
- **Stripe Integration (VII)**: No new payment flows introduced; ensure no regression in existing booking payments. Status: PASS.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

ios/ or android/
```
app/
├── my-courses/              # Participant dashboard entry point
│   └── page.tsx
├── courses/                 # Course detail and shared components
├── api/
│   ├── courses/             # API routes for course data
│   └── uploads/             # Existing file upload endpoints
components/
├── dashboard/
├── booking/
├── navigation/
├── monitoring/
├── payment/
└── admin/
lib/
├── actions/
├── auth/
├── db/
├── monitoring/
├── schemas/
└── services/
prisma/
├── schema.prisma
└── migrations/
tests/
├── contracts/
├── integration/
└── unit/
```

**Structure Decision**: Single Next.js web application. Feature work spans app/my-courses, app/courses, supporting components/, lib/actions for server mutations, lib/db Prisma client usage, and Prisma migrations.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - Confirm existing Prisma models for bookings, documents, and whether CourseParticipation requires new table vs extending current models.
   - Determine current résumé upload implementation (if any) to decide reuse vs new storage.
   - Validate Mux integration utilities and how course assets are currently stored.

2. **Generate and dispatch research tasks**:
   - Task: Audit Prisma schema for booking-related entities and document additions needed for CourseParticipation data (preparation, debriefing, results, timestamps, résumé metadata).
   - Task: Investigate existing upload pipeline (Clerk-authenticated uploads, storage buckets) to support single active résumé per booking with replace/remove workflow.
   - Task: Review lib/services or components integrating Mux to understand asset retrieval and gating logic.
   - Task: Check my-courses dashboard UX patterns for multi-step flows and progress indicators to align new UI.

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md resolving remaining gaps and documenting best practices for Prisma modeling, résumé storage, and Mux asset handling.

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Document CourseParticipation, ParticipationDocument, CourseSummaryAsset along with relationships to User, Course, Booking.
   - Capture status progression (Preparation → Summary → Debriefing → Results) and timestamp requirements.
   - Detail résumé metadata model (fileId, versioning, replacedAt) and summary asset override rules.

2. **Generate API/UI contracts** from functional requirements:
   - Define REST endpoints under app/api/my-courses/{bookingId}/... for preparation, résumé upload/remove, debriefing, and results.
   - Specify contract for summary asset retrieval including fallback (course default vs booking override).
   - Output OpenAPI-style YAML/JSON files into `specs/016-course-assignments/contracts/`.

3. **Generate contract tests** from contracts:
   - Jest-based tests in `tests/contracts/016-course-assignments/` asserting request validation, auth guards, and responses (mocked Prisma).
   - Ensure tests fail until endpoints implemented.

4. **Extract test scenarios** from user stories:
   - Encode integration tests for multi-step completion and résumé replacement using Playwright or integration harness; document approach in quickstart.md.

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`.
   - Add new tech context (Mux summary override behavior, single résumé rule) while keeping file under size limit.

**Output**: data-model.md, contracts/*, failing tests, quickstart.md, updated agent instructions.

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Derive tasks from data-model.md (Prisma migration + model updates), contracts (API routes + handlers), and quickstart (integration scenarios)
- Create parallelizable [P] tasks for résumé upload/remove API vs debriefing/result endpoints where independent
- Include UI workflow tasks for multi-step navigation, progress indicator, summary gating, and Clerk role guard validation
- Add observability tasks (Rollbar logging verification) and regression checks for payments unaffected

**Ordering Strategy**:

- TDD order: Contract tests, then Prisma schema tests, then UI tests before implementation
- Dependency order: Prisma models/migrations → API routes → server actions → UI components/pages → dashboard integration
- Parallelize résumé upload vs summary asset retrieval after shared infrastructure ready

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

- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
