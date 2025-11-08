# Implementation Plan: 001-vercel-postgres-prisma-setup

**Branch**: `001-vercel-postgres-prisma-setup` | **Date**: 2025-10-01 | **Spec**: `./spec.md`
**Input**: Feature specification from `/specs/001-vercel-postgres-prisma-setup/spec.md`

> Note – Documentation Quality Gates: PRs check markdown linting, spelling (DE/EN), and links. If
> checks fail, see README section "Docs checks – fixing failures".

## Execution Flow (/plan command scope)

```text
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

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands. No
implementation has been performed for this feature; repository remains in planning-only state:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Set up Vercel Postgres (Neon) with Prisma ORM in a Next.js (App Router) project, including
NextAuth.js (Prisma Adapter, JWT sessions) and an MUI (Material Design) UI baseline. Public pages
are delivered SEO-friendly via SSG/ISR; non-public areas (bookings/materials) use SSR on Node with
server-side authorization and noindex.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Next.js (App Router), React 18, Prisma Client, NextAuth.js, @mui/material,
@mui/icons-material  
**Storage**: PostgreSQL (Vercel Postgres/Neon) via Prisma ORM  
**Identity**: NextAuth.js with Prisma Adapter, JWT sessions  
**Testing**: Vitest + Playwright (smoke), jest-compat optional  
**Target Platform**: Web (SSR/SSG/ISR), deployment on Vercel  
**Project Type**: web (Next.js app)  
**Performance Goals**: Good CWV; SSG/ISR for SEO pages; minimal TTFB for SSR-protected pages  
**Constraints**: Prisma/NextAuth must run on Node runtime; non-public pages noindex; A11y WCAG 2.1
AA  
**Scale/Scope**: Small to medium (initial auth/DB baseline, few pages)  
**Design System**: Material Design via MUI

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

PASS (v1.7.0):

- Hybrid Rendering Policy observed (prefer SSG/ISR; SSR only when necessary)
- Prisma & NextAuth documented on Node runtime
- Domain & access segmentation (public vs non‑public) implemented incl. SEO/noindex
- MUI as the only UI toolkit; SSR styling via AppRouterCacheProvider

Note: FR-007 (Retention Policy) is intentionally DEFERRED and does not block this baseline. Resolve
post‑MVP.

## Rendering Strategy Matrix

For each route/page, specify rendering and runtime per the Hybrid Rendering Policy:

| Route                   | Strategy | Revalidate | Runtime | SEO Critical |
| ----------------------- | -------- | ---------: | ------- | ------------ |
| /                       | SSG      |      300 s | edge    | Yes          |
| /protected              | SSR      |          - | node    | No           |
| /api/auth/[...nextauth] | SSR      |          - | node    | No           |

Notes:

- SSR only if necessary (auth/personalization). Prefer SSG/ISR for SEO pages.
- Document `fetch` caching and headers where applicable.
- If using Prisma Adapter in NextAuth, auth route MUST run on Node runtime (Prisma is unsupported on
  Edge); document runtime choice.

### Domain Segmentation Notes

- Public: content like course/event listings is SEO‑relevant → use SSG/ISR, optionally structured
  data, maintain Open Graph/meta.
- Non‑public: participant areas (bookings/materials) → SSR on Node, server‑side authZ
  (getServerSession), robots noindex/nofollow.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
// No changes applied to source code by this plan. Concrete file trees will be generated during implementation phases.
```

**Structure Decision**: [Document the selected structure and reference the real directories captured
above]

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
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

### Prisma Planning Notes

If the feature involves data persistence with a relational DB:

- Default DB: PostgreSQL. If different, justify in this plan.
- Add or update `prisma/schema.prisma` with new models/relations.
- Plan migrations: name, order, and any backfill/cleanup steps.
- Identify routes/server modules that use Prisma → ensure Node runtime.
- Consider connection pooling strategy in the target environment (e.g., Vercel).
- Define testing approach: separate test DB, migrate before tests, seed/reset.

### Identity Planning Notes (NextAuth)

### UI/Material Design Planning Notes

If the feature introduces UI components or pages:

- Components: List new Material components (e.g., Button, Dialog, Snackbar, TextField) and their
  props/variants used.
- Theming: Note any theme tokens or overrides (palette, typography, spacing, shape) needed. Prefer
  theme customization over local styles.
- SSR Styling: Use MUI’s Next.js App Router integration (`AppRouterCacheProvider`).
- Accessibility: Identify ARIA roles/labels, keyboard navigation, focus traps (e.g., in Dialogs),
  and contrast considerations.
- Performance: Import icons individually, prefer lazy/dynamic imports for heavy components.
- Testing: Include accessibility checks and snapshot/interaction tests for UI states (hover, focus,
  error), and verify SSR hydration without style flash.

If the feature requires authentication/authorization:

- Providers: List the identity providers (e.g., Email magic link, GitHub, Google) and required
  scopes. Note any custom provider config.
- Session Strategy: Default JWT (stateless). Use database sessions only with clear invalidation
  needs; justify choice if deviating.
- Adapter: If user/account persistence is needed, prefer Prisma Adapter; ensure Node runtime for
  auth route when Prisma is used.
- Environment: Define required envs: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and provider credentials.
  Document how they’re set in Vercel/GitHub.
- Routing: Use App Router path `app/api/auth/[...nextauth]/route.ts`.
- Authorization: Describe protected routes and server-side checks using `getServerSession` and
  optional middleware.
- Security: Cookie flags (secure, SameSite), HTTPS enforcement, callback URL validation, CSRF
  considerations.
- Testing: Scenarios for login/logout, OAuth callback errors, and protected route access (positive
  and negative cases).

## Phase 1: Design & Contracts

Prerequisite: research.md complete.

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

This section describes what the /tasks command will do - DO NOT execute during /plan.

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

## Branching & CI Gates

Ensure the plan respects branching and CI rules defined in the constitution:

- Branch name matches: `feat/<###>-<slug>` or appropriate type
- Constitution gates mapped to checks: spec-validation, plan-constitution-check
- Lint, typecheck, tests, nextjs-build listed in checks
- Vercel preview expected for PRs; note environment variables if required

## Monitoring & Access Segmentation

- GitHub Checks: required → lint, typecheck, unit/E2E smoke, Next build; branch protection enabled.
- Security: Dependabot/Code Scanning enabled; Prisma Migrate only via CI/CD
  (`prisma migrate deploy`).
- Access: validate non‑public routes server‑side via `getServerSession` (Node runtime); set `robots`
  headers/meta to noindex.
- Observability (lightweight): Vercel Analytics optional; inspect logs via Vercel Dashboard.

## Documentation Quality Gates

### Objectives

- Automate documentation quality checks in pull requests and on main.
- Cover Markdown linting, spelling (DE/EN), and link validation.
- Defer FR-007 (retention policy) without blocking current work.

### What's included

- Markdown linting: Central rules configured; permissive for long lines, inline HTML in docs, and
  consistent bullet indentation.
- Spelling: Project-level dictionary that includes common tech terms (NextAuth, Prisma, Vercel,
  SSR/SSG/ISR); honors .gitignore; checks markdown and common source files.
- Link checking: Configuration for timeouts, concurrency, and exclusions; private links are ignored
  to avoid false positives.

### Workflows

- PR and main checks:
  - Run markdown linting on all markdown files.
  - Run spelling checks across docs and common code files.
  - Run a lightweight link checker on markdown to catch obvious dead links early.
- Nightly link scan:
  - Scheduled deep link validation to detect link rot without adding noise to PRs.

### Quality gates mapping

- Lint/Markdown: Enforced in PRs and on main; settings tuned to documentation needs.
- Spelling: Enforced in PRs; dictionary can be extended as new terms appear.
- Links: Light check in PRs; deeper nightly scan to avoid flakiness and rate limits.

## Phase 3+: Future Implementation

These phases are beyond the scope of the /plan command.

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

Fill ONLY if Constitution Check has violations that must be justified.

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

This checklist is updated during execution flow.

**Phase Status**:

- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command) — not executed
- [ ] Phase 4: Implementation complete — not executed
- [ ] Phase 5: Validation passed — not executed

**Gate Status**:

- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved — exception: FR‑007 is DEFERRED (Retention Policy) → not a
      blocker for this implementation
- [ ] Complexity deviations documented

---

_Based on Constitution v1.7.0 - See `/.specify/memory/constitution.md`_
