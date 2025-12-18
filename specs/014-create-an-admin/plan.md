# Implementation Plan: Course Admin Interface

**Branch**: `014-create-an-admin` | **Date**: 2025-12-15 | **Spec**: [spec.md](./spec.md) | **Input**: Feature specification from `specs/014-create-an-admin/spec.md`

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

**Primary Requirement**: Create a production-ready admin interface for managing course offerings with full CRUD operations, file upload support, and enrollment-aware deletion protection.

**Technical Approach**: 
- Next.js App Router with Server Actions for mutations and API routes for queries
- Clerk authentication with admin role verification via middleware
- Prisma ORM for type-safe database operations with PostgreSQL
- Vercel Blob for scalable thumbnail image storage
- Material-UI components following existing design system
- Zod validation with React Hook Form for robust client/server-side validation
- Optimistic locking to prevent concurrent edit conflicts
- Constitutional TDD workflow with contract tests, E2E validation, and Rollbar monitoring
- Enrollment transfer workflow required before course deletion to protect student data

## Technical Context

**Language/Version**: TypeScript 5+ with Next.js 15.5.6 (App Router)  
**Primary Dependencies**: React 18+, Material-UI v5, Clerk (auth), Prisma (ORM), Rollbar (monitoring)  
**Storage**: PostgreSQL with Prisma ORM for course data and enrollment relationships  
**Testing**: Playwright (E2E), Jest/Vitest (unit tests), contract testing for API endpoints  
**Target Platform**: Web application (Vercel deployment, SSR + client-side React)  
**Project Type**: Web (frontend + backend integrated via Next.js App Router)  
**Performance Goals**: <100ms API response for course listing, <2s page load for admin interface  
**Constraints**: Admin-only access via Clerk role, file uploads <10MB for thumbnails, student transfer required before course deletion  
**Scale/Scope**: Initial admin interface for ~10-50 courses, single admin user, production environment

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Test-First Development (NON-NEGOTIABLE)**:
- ✅ Contract tests will be created for all admin API endpoints before implementation
- ✅ Unit tests required for course CRUD operations, file upload, and enrollment checks
- ✅ E2E tests for complete admin workflow (create/edit/delete with Clerk auth)
- ✅ Minimum 80% coverage target, 90% for Clerk auth and course enrollment logic

**Code Quality & Formatting**:
- ✅ Prettier and ESLint compliance enforced via pre-commit hooks
- ✅ TypeScript strict mode for all new code
- ✅ CI/CD quality gates block merges for violations

**Feature Development Workflow**:
- ✅ Specification complete in specs/014-create-an-admin/spec.md with clarifications
- ✅ Clerk authentication integration for admin role verification
- ✅ Prisma migration required for course model updates (startTime, capacity fields)
- ✅ Rollbar error monitoring for file upload failures and enrollment conflicts

**Holistic Error Handling & Observability**:
- ✅ Rollbar integration mandatory for all error scenarios (file upload, enrollment checks)
- ✅ Error boundaries for admin UI components
- ✅ Graceful degradation when file upload service unavailable
- ✅ User-facing error messages with recovery guidance (e.g., "Transfer students first")

**Authentication & Security**:
- ✅ Clerk middleware validation for admin role on all /admin routes
- ✅ File upload validation (size, type, malware scanning)
- ✅ CSRF protection for course mutation operations
- ✅ Rollbar security incident tracking for unauthorized access attempts

**Component Architecture**:
- ✅ Material-UI design system for admin interface consistency
- ✅ Reusable form components for course create/edit
- ✅ WCAG 2.1 AA accessibility compliance

**Deployment Standards**:
- ✅ GitHub Actions exclusive deployment (no manual CLI)
- ✅ Preview deployment for PR testing with admin role assignment
- ✅ E2E tests against preview environment before production merge

**Initial Assessment**: PASS - All constitutional requirements alignable with feature scope

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

```
app/
├── admin/                    # NEW: Admin interface routes
│   ├── layout.tsx           # Admin layout with Clerk auth check
│   ├── page.tsx             # Course list view (sorted by startTime)
│   ├── courses/
│   │   ├── new/
│   │   │   └── page.tsx     # Create course form
│   │   └── [id]/
│   │       ├── edit/
│   │       │   └── page.tsx # Edit course form
│   │       └── delete/
│   │           └── page.tsx # Delete confirmation (enrollment check)
│   └── api/                 # Server actions (TBD: API routes vs server actions)
├── api/
│   └── admin/               # NEW: Admin API endpoints
│       └── courses/
│           ├── route.ts     # GET (list), POST (create)
│           └── [id]/
│               └── route.ts # GET, PATCH (update), DELETE

components/
├── admin/                   # NEW: Admin-specific components
│   ├── CourseForm.tsx      # Reusable create/edit form
│   ├── CourseList.tsx      # Course listing table
│   ├── CourseCard.tsx      # Individual course display
│   ├── DeleteConfirmation.tsx # Delete modal with enrollment warning
│   └── FileUpload.tsx      # Thumbnail upload component

lib/
├── actions/
│   └── admin/              # NEW: Server actions for admin operations
│       └── courses.ts      # Course CRUD server actions
├── db/
│   └── admin/              # NEW: Admin database queries
│       └── courses.ts      # Prisma queries for course management
├── types/
│   └── admin.ts            # NEW: Admin-specific TypeScript types
└── utils/
    └── fileUpload.ts       # NEW: File upload handling utilities

prisma/
└── migrations/             # NEW: Migration for course model updates
    └── [timestamp]_add_course_admin_fields/

tests/
├── contract/
│   └── admin/              # NEW: Contract tests for admin API
│       └── courses.spec.ts
├── e2e/
│   └── admin/              # NEW: E2E tests for admin workflows
│       ├── create-course.spec.ts
│       ├── edit-course.spec.ts
│       └── delete-course.spec.ts
└── unit/
    └── lib/
        └── actions/
            └── admin/      # NEW: Unit tests for server actions
                └── courses.spec.ts
```

**Structure Decision**: Next.js App Router web application with integrated frontend/backend. Admin interface follows existing app/ directory structure with dedicated admin/ route group for Clerk-protected admin pages. API routes in app/api/admin/ for RESTful operations. Reusable components in components/admin/ following MUI design system. Server-side logic in lib/actions/admin/ using Next.js server actions or API routes (research needed). Prisma database layer in lib/db/admin/ for type-safe queries.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

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

The `/tasks` command will generate a comprehensive task list following TDD principles and constitutional requirements. Tasks will be derived from:

1. **Contract Tests** (from `contracts/api-contract.md`):
   - One test file per API endpoint (LIST, GET, CREATE, PATCH, DELETE, TRANSFER)
   - Authentication tests for Clerk admin role verification
   - Request/response schema validation tests
   - Error handling and edge case tests
   - **Estimated**: 6 contract test tasks [P] (parallelizable)

2. **Database Schema** (from `data-model.md`):
   - Prisma migration for new Course fields (startTime, capacity, thumbnailUrl, level enum)
   - Database index creation on startTime column
   - Backfill script for existing courses (if any)
   - **Estimated**: 2 database tasks (sequential)

3. **Server Actions & API Routes**:
   - `lib/actions/admin/courses.ts` - Server actions for mutations
   - `lib/db/admin/courses.ts` - Prisma query functions
   - `app/api/admin/courses/route.ts` - LIST and CREATE endpoints
   - `app/api/admin/courses/[id]/route.ts` - GET, PATCH, DELETE endpoints
   - `app/api/admin/courses/[id]/transfer-enrollments/route.ts` - TRANSFER endpoint
   - **Estimated**: 5 backend tasks (some dependencies)

4. **UI Components** (from feature requirements):
   - `components/admin/CourseForm.tsx` - Reusable create/edit form with Zod validation
   - `components/admin/CourseList.tsx` - Course listing table with sorting
   - `components/admin/CourseCard.tsx` - Individual course display
   - `components/admin/DeleteConfirmation.tsx` - Modal with enrollment check
   - `components/admin/FileUpload.tsx` - Vercel Blob upload component
   - **Estimated**: 5 component tasks [P]

5. **Pages & Layouts**:
   - `app/admin/layout.tsx` - Admin layout with Clerk auth guard
   - `app/admin/page.tsx` - Course list view
   - `app/admin/courses/new/page.tsx` - Create course page
   - `app/admin/courses/[id]/edit/page.tsx` - Edit course page
   - `app/admin/courses/[id]/delete/page.tsx` - Delete confirmation page
   - **Estimated**: 5 page tasks (depend on components)

6. **Integration & E2E Tests** (from `quickstart.md`):
   - `tests/e2e/admin/create-course.spec.ts` - Full creation workflow
   - `tests/e2e/admin/edit-course.spec.ts` - Edit and optimistic locking
   - `tests/e2e/admin/delete-course.spec.ts` - Deletion protection and success
   - **Estimated**: 3 E2E test tasks

7. **Supporting Infrastructure**:
   - File upload utilities in `lib/utils/fileUpload.ts`
   - TypeScript types in `lib/types/admin.ts`
   - Zod schemas in `lib/schemas/admin/course.ts`
   - Middleware updates for admin route protection
   - Rollbar integration for error logging
   - **Estimated**: 5 infrastructure tasks

**Ordering Strategy**:

**Phase A: Foundation (Parallel)**
1. Database migration & backfill
2. TypeScript types & Zod schemas
3. Contract test scaffolding [P]

**Phase B: Backend (Dependencies)**
4. Prisma query functions (depends on migration)
5. Server actions (depends on queries & schemas)
6. API routes (depends on server actions)
7. Contract tests implementation (depends on API routes)

**Phase C: Frontend (Parallel after Backend)**
8. UI components [P] (depends on types & schemas)
9. File upload component (depends on Vercel Blob setup)
10. Pages & layouts (depends on components)

**Phase D: Integration (Sequential)**
11. Middleware admin guard (depends on Clerk setup)
12. E2E tests (depends on full feature implementation)
13. Rollbar error logging integration

**Phase E: Validation**
14. Run quickstart.md validation
15. Constitutional compliance review
16. Performance testing (API response times)

**Parallel Execution Markers**:
- [P] tasks can be worked on simultaneously by different developers or AI agents
- Database tasks are sequential (migrations must run in order)
- E2E tests should run serially to avoid test pollution

**Estimated Total Tasks**: 30-35 numbered, ordered tasks

**Critical Path Dependencies**:
1. Migration → Queries → Actions → API → Contract Tests
2. Types/Schemas → Components → Pages
3. Everything → E2E Tests → Validation

**Constitutional Checkpoints**:
- Task 7: Contract tests must fail before implementation (TDD gate)
- Task 15: Pre-merge constitutional review (quality gates)
- Task 35: Final E2E validation (deployment readiness)

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

- [x] Phase 0: Research complete (/plan command) - research.md generated
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md generated
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - strategy documented
- [ ] Phase 3: Tasks generated (/tasks command) - pending
- [ ] Phase 4: Implementation complete - pending
- [ ] Phase 5: Validation passed - pending

**Gate Status**:

- [x] Initial Constitution Check: PASS - All requirements alignable
- [x] Post-Design Constitution Check: PASS - No new violations introduced
- [x] All NEEDS CLARIFICATION resolved - Clarifications session completed with 5 answers
- [x] Complexity deviations documented - No deviations required

**Artifacts Generated**:
- ✅ `/specs/014-create-an-admin/research.md` - Technology decisions and best practices
- ✅ `/specs/014-create-an-admin/data-model.md` - Course entity and database schema
- ✅ `/specs/014-create-an-admin/contracts/api-contract.md` - API specifications
- ✅ `/specs/014-create-an-admin/quickstart.md` - 10-minute validation workflow
- ✅ `/.github/copilot-instructions.md` - Updated with feature context

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
