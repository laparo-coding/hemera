# Implementation Plan: Test Coverage

**Branch**: `028-test-coverage` | **Date**: 2026-04-17 | **Spec**: [specs/028-test-coverage/spec.md](specs/028-test-coverage/spec.md)  
**Input**: Feature specification from `specs/028-test-coverage/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → Completed
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Completed for planning scope
3. Fill the Constitution Check section based on the content of the constitution document
   → Completed
4. Evaluate Constitution Check section below
   → Pass
5. Execute Phase 0 → research.md
   → Completed
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific file
   → Completed
7. Re-evaluate Constitution Check section
   → Pass
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   → Completed
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The `/plan` command stops here. `tasks.md` is intentionally not created in this step.

## Summary

Increase Hemera test coverage in a measurable and best-practice-driven way across backend logic,
API behavior, and dashboard or authenticated user journeys. The plan reuses the existing Jest,
Testing Library, and Playwright infrastructure, expands measured confidence intentionally instead of
chasing vanity metrics, and introduces CI-enforced quality gates whose exact thresholds will be
fixed later from a fresh baseline during implementation planning.

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16, React 19, Node.js 20+  
**Primary Dependencies**: Jest 30, ts-jest, Playwright, @testing-library/react,
@testing-library/jest-dom, Biome, CSpell, Prisma, Rollbar  
**Storage**: N/A for planning artifacts; existing PostgreSQL via Prisma remains contextual only  
**Testing**: Jest (unit, component, contract), Playwright (E2E and production smoke), Biome,
CSpell  
**Target Platform**: Next.js web application on Vercel with GitHub Actions CI  
**Project Type**: web  
**Performance Goals**: Improve confidence without materially regressing CI stability; keep added
coverage work deterministic and suitable for existing CI quality gates  
**Constraints**: All test layers are in scope; CI gating is required; exact thresholds are deferred
to later planning from baseline data; low-value tests created only to maximize percentages are out
of scope  
**Scale/Scope**: Repo-wide coverage initiative focused first on business-critical backend logic,
API behavior, and dashboard or authenticated user journeys, using Feature 022 only as historical
context

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
| ---- | ------ | ----- |
| Test-First Development | PASS | The feature itself is a test and coverage initiative and preserves TDD ordering for downstream tasks. |
| Rollbar Error Logging | PASS | No console-based observability pattern is introduced; coverage planning favors regression-prone error paths. |
| Holistic Error Handling & Observability | PASS | Expanded test scope explicitly covers API behavior and critical user journeys, strengthening error-path verification. |
| GitHub Actions Workflow Discipline | PASS | CI quality gating is an explicit requirement; no manual bypass path is introduced. |
| Stripe Integration Fundamentals | PASS | Payment-related flows may be covered where relevant, but no production payment behavior is changed in planning. |
| Security & Privacy | PASS | Planning assumes safe fixtures, auth-aware test design, and no exposure of secrets or PII in artifacts. |
| Specs-First Workflow | PASS | Spec, research, plan, data model, contracts, and quickstart are all produced inside the feature directory. |

**Violations**: None.

## Project Structure

### Documentation (this feature)

```
specs/028-test-coverage/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   └── coverage-gates.md
└── tasks.md              # Created later by /tasks
```

### Source Code (repository root)

```
app/
components/
lib/
tests/
├── contracts/
├── e2e/
└── unit/

.github/
├── workflows/
└── copilot-instructions.md

jest.config.ts
package.json
playwright.config.ts
biome.json
```

**Structure Decision**: This is a web application with integrated frontend, backend, and shared
quality tooling. Planning therefore targets the real repository layout under `app/`, `components/`,
`lib/`, `tests/`, and `.github/workflows/` rather than inventing separate backend or frontend
subprojects.

## Phase 0: Outline & Research

### Completed Research Decisions

1. The current coverage baseline is real but narrow: measured coverage is centered on
   `lib/**/*.ts`.
2. Existing thresholds already exist and should be evolved carefully rather than replaced blindly.
3. All test layers are in scope, but E2E remains the most expensive layer and should be used
   selectively.
4. Feature 028 is standalone and should use Feature 022 only as historical context.
5. The practical planning target is to improve measurable confidence across backend logic, API
   behavior, and dashboard or authenticated user journeys while keeping CI gates meaningful.

### Phase 0 Output

- Existing artifact reused and accepted: [specs/028-test-coverage/research.md](specs/028-test-coverage/research.md)

## Phase 1: Design & Contracts

### 1. Data Model Direction

No Prisma or runtime database schema changes are planned for this feature. The design introduces
planning entities only, used to structure task generation, validation, and CI-gate decisions.

### 2. Contract Direction

This feature does not add new product-facing HTTP endpoints. Instead, Phase 1 defines planning
contracts for:

- what CI coverage gating must validate
- how global and critical-area coverage expectations relate
- which test layers and priority surfaces are in scope for the first increment

These contracts are captured as markdown specifications under `contracts/`.

### 3. Quickstart Direction

`quickstart.md` provides a validation path for future implementation work by focusing on:

- baseline measurement
- targeted coverage runs
- critical-area verification
- CI-aligned local checks

### 4. Planned Artifact Set

- `data-model.md`
- `contracts/README.md`
- `contracts/coverage-gates.md`
- `quickstart.md`

### 5. Agent Context Update

The repository agent context must be refreshed after plan completion so the active technologies and
recent changes reflect Feature 028.

## Phase 2: Task Planning Approach

_This section describes what `/tasks` will do. It does not create `tasks.md` yet._

**Task Generation Strategy**:

1. Baseline measurement tasks
   - capture current global coverage
   - capture critical-area coverage for backend, API, and dashboard or auth journeys
2. Scope expansion tasks
   - decide and implement the next `collectCoverageFrom` boundary
   - define critical-area mapping and ownership
3. Test addition tasks by layer
   - unit and component tasks for deterministic logic
   - contract tasks for API behavior
   - targeted E2E tasks for critical user journeys
4. CI gating tasks
   - introduce or refine CI checks
   - wire coverage reporting and failure conditions
5. Validation tasks
   - run focused coverage checks
   - confirm CI stability and runtime impact

**Ordering Strategy**:

- TDD-first: baseline and failing checks before implementation changes
- Shared logic before presentation-only surfaces
- CI gate design before threshold hardening
- Mark independent coverage additions as parallel where they touch disjoint files

**Estimated Output**: 18-26 ordered tasks in `tasks.md`

## Phase 3+: Future Implementation

_These phases are outside the scope of `/plan`._

**Phase 3**: `/tasks` generates `tasks.md`  
**Phase 4**: Implementation executes the ordered tasks  
**Phase 5**: Validation confirms coverage movement, CI gating, and regression confidence

## Complexity Tracking

No constitutional complexity deviations are required at planning time.

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved for planning scope
- [x] Complexity deviations documented

---

_Based on Constitution v1.10.0 - See `.specify/memory/constitution.md`_
