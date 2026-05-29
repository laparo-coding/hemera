# Implementation Plan: Jest to Vitest Migration

**Branch**: `029-jest-to-vitest-migration` | **Date**: 2026-05-28 | **Spec**: [specs/029-jest-to-vitest-migration/spec.md](specs/029-jest-to-vitest-migration/spec.md)  
**Input**: Feature specification from `specs/029-jest-to-vitest-migration/spec.md`

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

Migrate Hemera's non-E2E automated test stack from Jest and ts-jest to Vitest by replacing the
three current Jest entry points with a Vitest multi-project structure for unit, contract, and
integration tests, preserving the shared setup in `tests/setup.ts`, path alias resolution for `@/`,
coverage outputs, and contributor-facing script names where reasonable. The migration is planned as
small rollout slices that first establish Vitest infrastructure and compatibility, then move unit,
contract, and integration suites independently, while leaving Playwright E2E workflows unchanged.

## Technical Context

**Language/Version**: TypeScript 6.0, Next.js 16.2, React 19, Node.js 20+  
**Primary Dependencies**: Jest 30, ts-jest, Vitest (target), Vite or Vitest config support,
@testing-library/react, @testing-library/jest-dom, Prisma, Testcontainers, Biome  
**Storage**: N/A for planning artifacts; existing PostgreSQL via Prisma remains contextual through
test setup and integration flows  
**Testing**: Current state uses `jest.config.ts`, `jest.contract.config.ts`,
`jest.integration.config.ts`, shared setup in `tests/setup.ts`, and Playwright for E2E; target
state uses Vitest for unit, contract, and integration only, with Playwright unchanged  
**Target Platform**: Next.js web application on local Node.js and GitHub Actions CI  
**Project Type**: web  
**Performance Goals**: Keep non-E2E validation deterministic and CI-suitable; avoid materially
slower local or CI runtime after migration; preserve sequential behavior where database-backed tests
require it  
**Constraints**: Preserve separate unit, contract, and integration entry points; preserve shared
setup behavior from `tests/setup.ts`; preserve `@/` alias resolution; preserve or intentionally
replace `text`, `lcov`, `html`, and `json-summary` coverage outputs; many existing tests import
from `@jest/globals` and use `jest.mock`, `jest.fn`, `jest.spyOn`, `jest.Mocked`, and per-file
`@jest-environment jsdom` pragmas; Playwright E2E must remain untouched  
**Scale/Scope**: Repository-wide migration of the current non-E2E test inventory under
`tests/unit/`, `tests/contracts/`, and `tests/integration/`, including Node and jsdom-backed tests,
mock-heavy service tests, and database-aware setup paths

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
| ---- | ------ | ----- |
| Test-First Development | PASS | The migration preserves and clarifies unit, contract, and integration layers rather than collapsing them. Downstream tasks should migrate each layer with failing checks first. |
| Testing Requirements | PASS | Unit, contract, integration, error handling, and monitoring-related tests remain in scope; Playwright stays the E2E layer. |
| Holistic Error Handling & Observability | PASS | The plan preserves tests that validate Rollbar and failure scenarios, and requires parity checks for error-path behavior during migration. |
| Code Organization | PASS | No runtime product architecture is changed; planning is limited to test infrastructure, scripts, and support files. |
| GitHub Actions Workflow Discipline | PASS | CI validation remains a first-class acceptance criterion; no manual or ad hoc workflow bypass is introduced. |
| Security & Privacy | PASS | The plan keeps existing environment loading and database lifecycle handling, with no new secret handling model. |
| Specs-First Workflow | PASS | Spec, plan, research, data model, contracts, and quickstart are produced inside the feature directory before implementation. |

**Violations**: None.

## Project Structure

### Documentation (this feature)

```
specs/029-jest-to-vitest-migration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── coverage-and-reporting.md
│   └── non-e2e-test-workflows.md
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
├── integration/
├── unit/
└── setup.ts

package.json
tsconfig.json
jest.config.ts
jest.contract.config.ts
jest.integration.config.ts
playwright.config.ts
```

**Structure Decision**: This is a single Next.js web application with shared source and test
infrastructure. The migration therefore targets the existing root-level scripts and test configs,
plus the current repository test directories, instead of inventing separate frontend and backend
test runners.

## Phase 0: Outline & Research

### Completed Research Decisions

1. Replace the current three Jest configs with a Vitest multi-project setup that keeps unit,
   contract, and integration scopes explicit.
2. Preserve contributor-facing script names wherever possible and change the implementation behind
   those scripts rather than introducing a disruptive new command surface.
3. Treat Jest compatibility as an explicit migration concern: replace `@jest/globals` imports,
   `jest.*` mocks and spies, and `@jest-environment jsdom` pragmas with one approved Vitest
   equivalent model.
4. Preserve `tests/setup.ts` as the shared setup spine, but adapt lifecycle imports and jsdom
   detection for Vitest.
5. Preserve coverage artifact usefulness, not byte-for-byte Jest internals. Equivalent `text`,
   `lcov`, `html`, and `json-summary` outputs are required for downstream workflows.
6. Keep Playwright completely unchanged so non-E2E migration risk stays isolated.

### Phase 0 Output

- Created: `specs/029-jest-to-vitest-migration/research.md`

## Phase 1: Design & Contracts

### 1. Data Model Direction

No Prisma or runtime product entities change for this feature. The design introduces planning
entities for test scopes, runner configuration, shared setup compatibility, coverage artifacts, and
rollout slices.

### 2. Contract Direction

This feature does not introduce new product-facing HTTP endpoints. Phase 1 therefore defines
planning contracts for:

- repository-managed non-E2E command behavior
- coverage and reporting parity expectations
- compatibility expectations for setup, aliases, mocks, and environments

These contracts are captured as markdown documents under `contracts/`.

### 3. Quickstart Direction

`quickstart.md` defines the local validation path for the implementation phase, including the Jest
baseline capture, incremental Vitest migration validation, and the unchanged Playwright smoke check.

### 4. Technical Decisions

- Use one Vitest configuration surface with explicit named projects for `unit`, `contracts`, and
  `integration`, instead of a single opaque test pool.
- Preserve current `package.json` script names for `test`, `test:unit`, `test:unit:coverage`,
  `test:contracts`, and `test:integration`, while swapping their internals to Vitest.
- Keep `tests/setup.ts` as the shared setup file and migrate lifecycle imports from Jest to Vitest.
- Replace `@jest/globals` imports and `jest.*` API usage with `vitest` imports and `vi.*`, using a
  codemod-friendly migration slice before targeted manual repairs.
- Migrate jsdom test pragmas from `@jest-environment jsdom` to Vitest's per-file environment
  marker so React component tests keep their environment isolation.
- Preserve alias support for `@/` through Vitest-aware path resolution aligned with `tsconfig.json`.
- Preserve sequential execution for database-backed scopes until evidence shows safe parallelism.
- Keep Playwright scripts, config, and E2E projects unchanged.

### 5. Rollout Slices

1. Infrastructure slice
   - add Vitest dependencies and root config
   - establish alias resolution, setup loading, coverage reporters, and baseline scripts
   - keep Jest available temporarily for safe comparison
2. Compatibility slice
   - codemod `@jest/globals` imports to `vitest`
   - replace `jest.mock`, `jest.fn`, `jest.spyOn`, `jest.Mocked*`, and jsdom pragmas
   - fix type-level incompatibilities such as `types: ["node", "jest"]`
3. Unit slice
   - migrate default unit suite and unit coverage command
   - validate Node and jsdom unit tests under Vitest
4. Contract slice
   - migrate contract suite with existing setup and alias behavior intact
   - verify route-handler and API contract tests still isolate dependencies correctly
5. Integration slice
   - migrate integration suite with database setup, Prisma migrations, seed handling, and ignored
     spec exceptions preserved intentionally
6. Cleanup slice
   - remove Jest and ts-jest dependencies and config files
   - update docs and CI references to the Vitest baseline

### 6. Planned Artifact Set

- `data-model.md`
- `contracts/README.md`
- `contracts/non-e2e-test-workflows.md`
- `contracts/coverage-and-reporting.md`
- `quickstart.md`

## Phase 2: Task Planning Approach

_This section describes what `/tasks` will do. It does not create `tasks.md` yet._

**Task Generation Strategy**:

1. Baseline capture tasks
   - inventory current Jest scripts, config behavior, setup behavior, and coverage outputs
   - capture a known-good Jest baseline for unit, contract, and integration scopes
2. Infrastructure tasks
   - add Vitest dependencies and config
   - preserve alias resolution, setup loading, and coverage reporters
   - introduce side-by-side validation before the final script switch
3. Compatibility tasks
   - codemod imports and common mock APIs
   - convert jsdom directives and shared type references
   - repair edge cases where Jest and Vitest types differ
4. Suite migration tasks by slice
   - migrate unit first
   - migrate contract second
   - migrate integration third
5. Cleanup and documentation tasks
   - remove Jest-specific dependencies and config
   - update contributor docs and CI references
6. Validation tasks
   - run focused per-scope commands
   - compare coverage artifacts
   - confirm Playwright remains unchanged

**Ordering Strategy**:

- Preserve a reversible path until each scope passes under Vitest.
- Migrate the broad compatibility surface before chasing individual spec failures.
- Validate each slice independently before moving to the next one.
- Keep cleanup last so rollback remains cheap during migration.

**Estimated Output**: 20-28 ordered tasks in `tasks.md`

## Phase 3+: Future Implementation

_These phases are outside the scope of `/plan`._

**Phase 3**: `/tasks` generates `tasks.md`  
**Phase 4**: Implementation executes the ordered tasks  
**Phase 5**: Validation confirms command parity, suite parity, coverage parity, and unchanged
Playwright behavior

## Risks

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Jest-specific mock APIs are used broadly across unit and contract tests | High | Perform a compatibility slice first, favor codemod-friendly replacements, and reserve manual cleanup for outliers |
| Current per-file `@jest-environment jsdom` directives do not transfer automatically | High | Convert directives deliberately and validate jsdom-backed component suites before switching the default script |
| `tests/setup.ts` mixes environment loading, database lifecycle, polyfills, and Jest lifecycle imports | High | Keep one shared setup file, migrate lifecycle hooks first, and validate both Node and jsdom execution paths |
| `tsconfig.json` currently includes Jest types | Medium | Introduce Vitest-aware type configuration before removing Jest packages to avoid editor and build churn |
| Coverage artifacts may differ subtly between Jest V8 output and Vitest output | Medium | Validate required reporter formats explicitly and treat equivalent consumer value as the acceptance standard |
| Integration tests rely on sequential database behavior and ignored-file exceptions | Medium | Preserve single-worker execution and existing ignore intent until a separate feature revisits parallelism or suite scope |

## Validation Strategy

- Establish a Jest baseline for `test:unit`, `test:unit:coverage`, `test:contracts`, and
  `test:integration` before implementation changes.
- Validate each rollout slice with the narrowest command that proves parity for that slice.
- Run coverage verification after the unit slice and again after the final non-E2E script switch.
- Run the unchanged Playwright smoke path after the non-E2E migration to confirm E2E separation is
  intact.
- Use `npm run typecheck` and `npm run lint` as cross-cutting gates once the compatibility slice is
  in place.

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

_Based on Constitution v1.11.0 - See `.specify/memory/constitution.md`_
