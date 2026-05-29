# Quickstart: Jest to Vitest Migration (Spec 029)

**Date**: 2026-05-28 | **Plan**: [plan.md](plan.md)

## Purpose

This quickstart defines the local validation path for the migration from Jest to Vitest across
unit, contract, and integration tests. It explicitly keeps Playwright unchanged.

## Prerequisites

- Node.js 20+
- npm 9+
- Project dependencies installed
- Repository env files available where current non-E2E tests require them
- Docker available if the integration baseline needs ephemeral PostgreSQL via Testcontainers

## Baseline Capture Before Implementation

### 1. Confirm Current Repository Health

```bash
npm run typecheck
npm run lint
```

Expected result:
- no TypeScript errors
- no Biome failures unrelated to the migration feature

### 2. Validate the Current Jest-Backed Non-E2E Baseline by Scope

```bash
npm run test:unit
npm run test:unit:coverage
npm run test:contracts
npm run test:integration
```

Expected result:
- the current Jest-backed scopes establish the pre-migration baseline
- failures, skips, ignored specs, and coverage artifacts are recorded against the existing runner

### 3. Confirm Playwright Remains Separate

```bash
npm run test:e2e:public
```

Expected result:
- Playwright still runs independently of non-E2E tooling
- no migration work is required in Playwright config or scripts

## Incremental Validation During Implementation

### 4. Validate the Vitest Infrastructure Slice

Representative commands after Vitest config exists:

```bash
npm run typecheck
npm run lint
npm run test:unit
```

Expected result:
- Vitest resolves `@/` imports
- shared setup loads successfully
- at least the unit slice can run through the new runner without touching Playwright

### 5. Validate Compatibility Conversion

Representative checks after the compatibility slice:

```bash
npm run typecheck
npm run test:unit
```

Expected result:
- `@jest/globals` imports are gone from migrated scopes
- `jest.*` mocks and spies have approved Vitest replacements
- jsdom-marked files still execute in jsdom and Node files stay on Node by default

### 6. Validate Scope-by-Scope Migration

Unit slice:

```bash
npm run test:unit -- --runInBand
npm run test:unit:coverage
```

Contract slice:

```bash
npm run test:contracts
```

Integration slice:

```bash
npm run test:integration
```

Expected result:
- each non-E2E scope passes independently under Vitest
- database-backed integration behavior still works with existing setup expectations

### 7. Validate Final Non-E2E Baseline

```bash
npm run test
npm run test:unit:coverage
npm run test:contracts
npm run test:integration
npm run typecheck
npm run lint
```

Expected result:
- repository-managed non-E2E entry points are Vitest-backed
- required coverage artifacts are present and consumable
- type and lint baselines remain healthy

### 8. Confirm Playwright Is Still Unchanged

```bash
npm run test:e2e:public
```

Expected result:
- Playwright still operates as the repository's E2E framework
- non-E2E migration changes did not leak into the E2E path

## Verification Checklist

- [ ] Non-E2E baseline validated under Vitest
- [ ] Vitest infrastructure established without breaking alias resolution or setup loading
- [ ] Jest API compatibility migrated to one approved Vitest model
- [ ] Unit suite passes under Vitest
- [ ] Contract suite passes under Vitest
- [ ] Integration suite passes under Vitest
- [ ] Coverage outputs remain available in expected formats
- [ ] Playwright remains unchanged and operational

## Next Step

Run `/tasks` to convert this plan into an ordered implementation backlog.