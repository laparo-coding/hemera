# Data Model: Jest to Vitest Migration (Spec 029)

**Date**: 2026-05-28 | **Plan**: [plan.md](plan.md)

## Overview

Feature 029 does not add runtime database entities. The following planning entities model the
repository's non-E2E test infrastructure, migration slices, and validation outcomes.

## Planning Entities

### TestScope

Represents one repository-managed non-E2E validation layer.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Stable scope identifier (`unit`, `contracts`, `integration`) |
| `name` | `string` | Yes | Human-readable scope name |
| `sourcePaths` | `string[]` | Yes | Test file globs or directories for the scope |
| `defaultEnvironment` | `enum` | Yes | `node` or `jsdom` |
| `setupFile` | `string` | Yes | Shared setup entry point |
| `requiresSequentialExecution` | `boolean` | Yes | Whether the scope must run with limited parallelism |
| `coverageEnabled` | `boolean` | Yes | Whether the scope contributes to formal coverage output |

### RunnerProject

Represents one Vitest project definition replacing a current Jest config.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Stable project identifier |
| `scopeId` | `string` | Yes | Linked `TestScope` identifier |
| `includePatterns` | `string[]` | Yes | Test include globs |
| `excludePatterns` | `string[]` | Yes | Explicit ignore globs |
| `aliasStrategy` | `enum` | Yes | `tsconfig-paths`, `manual-alias`, or `hybrid` |
| `timeoutMs` | `number` | Yes | Per-test timeout |
| `setupFiles` | `string[]` | Yes | Setup files loaded before tests |

### SetupRuntimeCapability

Represents a capability currently carried by `tests/setup.ts` that must survive the migration.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Stable capability identifier |
| `name` | `string` | Yes | Capability name |
| `category` | `enum` | Yes | `env`, `polyfill`, `lifecycle`, `database`, `cleanup`, `dom-matcher` |
| `requiredForScopes` | `string[]` | Yes | Linked `TestScope` ids |
| `parityRequirement` | `string` | Yes | What must remain true after migration |

### MockCompatibilityPattern

Represents one Jest-specific API family that must be replaced consistently.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Stable compatibility identifier |
| `legacyApi` | `string` | Yes | Current Jest API usage |
| `targetApi` | `string` | Yes | Target Vitest API usage |
| `migrationStrategy` | `enum` | Yes | `codemod`, `manual`, or `mixed` |
| `riskLevel` | `enum` | Yes | `low`, `medium`, or `high` |
| `validationSignal` | `string` | Yes | Command or evidence that proves parity |

### CoverageArtifact

Represents one coverage output that downstream users or automation consume.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Stable artifact identifier |
| `format` | `enum` | Yes | `text`, `lcov`, `html`, `json-summary` |
| `producer` | `enum` | Yes | `jest-v8`, `vitest-v8` |
| `outputPath` | `string` | Yes | Expected output location |
| `consumerType` | `enum` | Yes | `human`, `ci`, `script`, or `mixed` |
| `parityRule` | `string` | Yes | Required equivalence rule |

### MigrationSlice

Represents one ordered rollout slice in the implementation plan.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Stable slice identifier |
| `name` | `string` | Yes | Slice name |
| `order` | `number` | Yes | Execution order |
| `focusArea` | `enum` | Yes | `infrastructure`, `compatibility`, `unit`, `contracts`, `integration`, `cleanup` |
| `touchesScopes` | `string[]` | Yes | Linked `TestScope` ids |
| `entryCriteria` | `string` | Yes | What must be true before the slice starts |
| `exitCriteria` | `string` | Yes | What proves the slice is complete |

## Relationships

- `TestScope` 1:1 `RunnerProject` - each non-E2E scope is backed by one primary Vitest project.
- `TestScope` 1:N `SetupRuntimeCapability` - one scope can depend on many shared setup behaviors.
- `TestScope` 1:N `MigrationSlice` - one scope can be touched by multiple rollout slices.
- `MockCompatibilityPattern` N:1 `MigrationSlice` - multiple compatibility patterns are handled in
  the compatibility slice.
- `CoverageArtifact` N:N `TestScope` - coverage outputs can summarize one or more scopes.

## State Model

### MigrationSlice.order

```text
1 infrastructure -> 2 compatibility -> 3 unit -> 4 contracts -> 5 integration -> 6 cleanup
```

## Validation Rules

| Entity | Rule |
| ------ | ---- |
| `TestScope` | Must map to a real repository directory or include glob and declare whether sequential execution is required |
| `RunnerProject` | Must preserve explicit include and exclude behavior that matches current Jest scope intent |
| `SetupRuntimeCapability` | Must be backed by a real behavior currently present in `tests/setup.ts` |
| `MockCompatibilityPattern` | Must define exactly one approved target API family for repository-wide consistency |
| `CoverageArtifact` | Must specify both output format and a parity rule that can be validated locally or in CI |
| `MigrationSlice` | Must define both entry and exit criteria so each slice is reversible and testable |

## Out of Scope

- No Prisma schema changes
- No application runtime feature changes
- No Playwright E2E model changes
- No new HTTP API contracts