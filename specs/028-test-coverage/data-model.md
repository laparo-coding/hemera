# Data Model: Test Coverage (Spec 028)

**Date**: 2026-04-17 | **Plan**: [plan.md](plan.md)

## Overview

Feature 028 does not introduce runtime database entities. The following entities are planning
entities used to structure implementation, validation, and CI gating.

## Planning Entities

### CoverageBaseline

Represents the measured starting point before coverage work begins.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Stable identifier for the baseline snapshot |
| `measuredAt` | `ISO datetime` | Yes | When the baseline was captured |
| `source` | `enum` | Yes | Coverage source (`jest-v8`, `playwright-derived`, `ci-report`) |
| `scope` | `enum` | Yes | Coverage scope (`global`, `critical-area`) |
| `targetPath` | `string` | No | Specific path or area covered by the snapshot |
| `branches` | `number` | No | Branch coverage percentage |
| `functions` | `number` | No | Function coverage percentage |
| `lines` | `number` | Yes | Line coverage percentage |
| `statements` | `number` | No | Statement coverage percentage |
| `notes` | `string` | No | Context or caveats about the measurement |

### CriticalArea

Represents a high-value surface that should receive focused coverage attention.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Stable critical-area identifier |
| `name` | `string` | Yes | Human-readable area name |
| `category` | `enum` | Yes | `backend-logic`, `api-behavior`, `dashboard-journey` |
| `paths` | `string[]` | Yes | Source paths or feature surfaces included |
| `rationale` | `string` | Yes | Why the area is coverage-critical |
| `primaryTestLayers` | `string[]` | Yes | Preferred test layers for this area |

### CoverageTarget

Represents a target outcome for either global or critical-area coverage.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Stable target identifier |
| `scope` | `enum` | Yes | `global` or `critical-area`; `critical-area` requires a non-empty `linkedAreaId` |
| `linkedAreaId` | `string` | Conditionally required | Required as a non-empty string when scope is `critical-area`; omitted for `global` |
| `gateType` | `enum` | Yes | `report-only`, `soft-gate`, `hard-gate` |
| `thresholdStrategy` | `enum` | Yes | `absolute`, `delta`, `mixed` |
| `branchThreshold` | `number` | Conditionally required | Used only when `thresholdStrategy` is `absolute` or `mixed`; for `absolute`, at least one of `branchThreshold` or `lineThreshold` must be set; for `mixed`, at least one absolute threshold plus `deltaThreshold` must be set |
| `lineThreshold` | `number` | Conditionally required | Used only when `thresholdStrategy` is `absolute` or `mixed`; for `absolute`, at least one of `branchThreshold` or `lineThreshold` must be set; for `mixed`, at least one absolute threshold plus `deltaThreshold` must be set |
| `deltaThreshold` | `number` | Conditionally required | Required when `thresholdStrategy` is `delta` or `mixed`; `mixed` also requires at least one of `branchThreshold` or `lineThreshold` |
| `status` | `enum` | Yes | `proposed`, `approved`, `enforced` |
| `notes` | `string` | No | Additional rationale or rollout constraints |

### TestWorkstream

Represents an implementation slice for increasing coverage.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Stable workstream identifier |
| `name` | `string` | Yes | Workstream name |
| `priority` | `enum` | Yes | `high`, `medium`, `low` |
| `focusArea` | `enum` | Yes | `backend-logic`, `api-behavior`, `dashboard-journey`, `shared-infra` |
| `testLayers` | `string[]` | Yes | Layers used in the workstream |
| `candidatePaths` | `string[]` | Yes | Expected touched paths |
| `successSignal` | `string` | Yes | How the workstream proves value |

### QualityGateDefinition

Represents the CI-facing enforcement rule for coverage-related quality.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Stable quality-gate identifier |
| `name` | `string` | Yes | Human-readable gate name |
| `pipelineStage` | `enum` | Yes | `pull-request`, `main`, `nightly` |
| `inputs` | `string[]` | Yes | Reports or commands the gate consumes |
| `failureCondition` | `string` | Yes | Condition that fails the gate (for example `branch-coverage < 80%`, `delta-coverage < 5%`, `tests.failed > 0`) |
| `rolloutPhase` | `enum` | Yes | `planned`, `trial`, `enforced` |

## Relationships

- `CoverageBaseline` 1:N `CoverageTarget` - Ein CoverageBaseline kann von mehreren CoverageTarget referenziert werden.
- `CriticalArea` 1:N `CoverageTarget` - Eine CriticalArea kann mehreren CoverageTarget als referenzierte Fläche dienen.
- `CriticalArea` 1:N `TestWorkstream` - Eine CriticalArea kann mehrere TestWorkstream bündeln, während jeder TestWorkstream genau eine fokussierte Fläche referenziert.
- `TestWorkstream` 1:N `CoverageTarget` - Ein TestWorkstream kann mehrere CoverageTarget vorantreiben, die ihm als Umsetzungsziel zugeordnet sind.
- `QualityGateDefinition` 1:N `CoverageTarget` - Eine QualityGateDefinition kann mehreren CoverageTarget als CI-Enforcement-Regel zugeordnet werden.

## State Model

### CoverageTarget.status

```text
proposed -> approved -> enforced
```

### QualityGateDefinition.rolloutPhase

```text
planned -> trial -> enforced
```

## Validation Rules

| Entity | Rule |
| ------ | ---- |
| `CoverageBaseline` | Must reference a real measurement source and a capture time; at least one metric field must be present and `lines` is required as the default baseline metric |
| `CriticalArea` | Must map to real repository paths or explicitly named user journeys |
| `CoverageTarget` | If `scope` is `critical-area`, `linkedAreaId` must be a non-empty string; `absolute` requires at least one of `branchThreshold` or `lineThreshold`, `delta` requires `deltaThreshold`, and `mixed` requires `deltaThreshold` plus at least one of `branchThreshold` or `lineThreshold` |
| `TestWorkstream` | Must declare at least one test layer and one success signal |
| `QualityGateDefinition` | Must define an observable failure condition suitable for CI using operators like `<`, `<=`, `>`, `>=`, `==` and units like `%` or integer counts |

## Out of Scope

- No Prisma schema migration
- No new runtime persistence layer
- No production API schema changes caused by this planning artifact
