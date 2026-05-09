# Quickstart: Test Coverage (Spec 028)

**Date**: 2026-04-17 | **Plan**: [plan.md](plan.md)

## Purpose

This quickstart validates the planning assumptions for Feature 028 and provides the baseline
commands that the later implementation should use to measure and improve coverage.

## Prerequisites

- Node.js 20+
- npm 9+
- Project dependencies installed
- `.env.local` present for repo-standard test execution where required

## Setup

```bash
# 1. Checkout the feature branch
# Run these commands from your repository root
git checkout 028-test-coverage

# 2. Install dependencies if needed
npm install
```

## Baseline Validation

### 1. Confirm Type Safety and Lint Baseline

```bash
npm run typecheck
npm run lint
```

Expected result:
- no TypeScript errors
- no Biome failures

### 2. Capture the Current Jest Coverage Baseline

```bash
npm test -- --coverage --runInBand
```

Expected result:
- coverage output generated in `coverage/`
- baseline values available for global and `lib/services/`
- no assumption yet that new thresholds are final

### 3. Validate the Existing Unit and Contract Layers

```bash
npm run test:unit -- --runInBand
npm run test:contracts -- --runInBand
```

Expected result:
- current Jest-backed test layers run successfully
- candidate gaps can be identified from failures, skips, or low-signal areas

### 4. Validate Current E2E Infrastructure

```bash
npm run test:e2e
```

Optional focused runs:

```bash
npx playwright test --project=chromium-auth
npx playwright test --project=production-smoke
```

Expected result:
- Playwright projects remain operational
- dashboard and authenticated journey scope can be planned realistically

### 5. Identify Candidate Critical Areas

Use the current repository structure and recent tests to shortlist the first mixed-priority areas:

- backend logic under `lib/`
- API behavior under `app/api/`
- dashboard or authenticated journeys under `app/`, `components/`, and `tests/e2e/`

## Planning Verification Checklist

- [ ] Baseline TypeScript and lint state recorded
- [ ] Current coverage baseline captured
- [ ] Current unit and contract layers validated
- [ ] Current E2E infrastructure validated
- [ ] Candidate critical areas identified for backend, API, and dashboard journeys
- [ ] CI gating approach deferred to threshold-setting work after baseline review

## Next Step

Run `/tasks` to convert this plan into an ordered implementation backlog.
