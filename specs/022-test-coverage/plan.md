# Implementation Plan: Test Coverage

**Branch**: `022-test-coverage` | **Date**: 2026-01-28 | **Spec**: [spec.md](./spec.md)

## Execution Flow Status

- [x] Step 1: Load feature spec ✅
- [x] Step 2: Fill Technical Context ✅
- [x] Step 3: Constitution Check ✅
- [x] Step 4: Evaluate Constitution Check ✅
- [x] Step 5: Phase 0 Research ✅ (bereits vorhanden)
- [x] Step 6: Phase 1 Design ✅
- [x] Step 7: Re-evaluate Constitution ✅
- [x] Step 8: Plan Phase 2 ✅
- [x] Step 9: STOP - Ready for /tasks ✅

## Summary

Extend und stabilize die E2E- und Unit-Test-Suite für Hemera:
- **Issue #357**: React Component Testing aktivieren (tsconfig.json Exclusion entfernen)
- **Issue #384**: Course-Detail E2E Tests reparieren (CI-Timeout lösen)
- **Stripe E2E**: Checkout-Tests mit Clerk Test-User aktivieren
- **Invoice Download**: E2E-Test für Rechnungsdownload
- **Production Smoke**: Scheduled Job für Production Login
- **Console.log Audit**: Durch Rollbar Logging ersetzen
- **Coverage**: 70% global, 85% für lib/services/

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16, React 19
**Primary Dependencies**: Jest, Playwright, @testing-library/react, Rollbar
**Storage**: PostgreSQL via Prisma 7.3
**Testing**: Jest (unit/contract), Playwright (e2e), @testing-library/react (components)
**Target Platform**: Vercel (Production), GitHub Actions (CI)
**Project Type**: Web (Next.js App Router)
**Performance Goals**: E2E-Tests < 5 Minuten, Test-Flakiness < 5%
**Constraints**: 70% Coverage global, 85% für lib/services/, keine echten Stripe-Transaktionen
**Scale/Scope**: ~40 übersprungene E2E-Tests aktivieren, ~50 console.log/error ersetzen

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
|------|--------|-------|
| Test-First Development | ✅ Pass | Feature ist Test-fokussiert, aktiviert bestehende Tests |
| Rollbar Mandatory Logging | ✅ Pass | FR-7 implementiert Rollbar-Ersetzung für console.log/error |
| Coverage Thresholds | ✅ Pass | 70%/85% aligned mit Constitution (80% min für critical paths) |
| Stripe Test Mode | ✅ Pass | Nur Testmode Keys, keine echten Transaktionen |
| GitHub Actions Deployment | ✅ Pass | Production Tests als Scheduled Workflow |
| Error Handling Tests | ✅ Pass | Console.log → Rollbar Migration verbessert Observability |
| PII Filtering | ✅ Pass | Rollbar-Integration filtert bereits PII |

**Violations**: Keine

## Project Structure

### Documentation (this feature)

```
specs/022-test-coverage/
├── plan.md              # This file
├── research.md          # ✅ Bereits vorhanden
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code Changes

```
# Configuration Updates
tsconfig.json            # Remove component test exclusion
jest.config.ts           # Coverage thresholds
playwright.config.ts     # Production project + auth setup
biome.json               # no-console rule

# New Workflows
.github/workflows/
├── production-smoke.yml # Scheduled daily production tests

# Test Files (activate/fix)
tests/e2e/
├── course-detail.spec.ts        # Re-enable (fix timeout)
├── checkout.spec.ts             # Enable auth tests
├── invoice-download.spec.ts     # New E2E test
└── auth-setup.ts                # Playwright auth state

# Console.log Migration (audit)
app/                     # API routes + pages
lib/                     # Services + utilities
components/              # Error handlers
```

## Phase 0: Research (Complete)

✅ **Bereits abgeschlossen** - siehe [research.md](./research.md)

### Key Findings

| Topic | Finding | Decision |
|-------|---------|----------|
| Issue #357 | Component Tests funktionieren bereits | Nur tsconfig.json Exclusion entfernen |
| Issue #384 | CI-Timeout bei SSR | Warmup + höheres Timeout implementieren |
| Stripe Auth | Tests skippen wegen fehlender Clerk Auth | Playwright auth state mit echtem Login |
| Console.log | ~50 Vorkommen in Production-Code | Durch Rollbar ersetzen |

## Phase 1: Design & Contracts

### 1.1 Configuration Changes (No new entities)

**tsconfig.json** - Exclusion entfernen:
```diff
"exclude": [
  "node_modules",
  ...
- "tests/unit/components/**/*.spec.tsx"
]
```

**jest.config.ts** - Coverage Thresholds:
```typescript
coverageThreshold: {
  global: { branches: 70, functions: 70, lines: 70, statements: 70 },
  './lib/services/': { branches: 85, functions: 85, lines: 85, statements: 85 }
}
```

**biome.json** - no-console Rule:
```json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noConsole": "error"
      }
    }
  }
}
```

### 1.2 Playwright Auth Setup

**playwright.config.ts** - Neue Projekte:
```typescript
projects: [
  {
    name: 'setup',
    testMatch: /auth-setup\.ts/,
  },
  {
    name: 'chromium-auth',
    use: { storageState: '.auth/user.json' },
    dependencies: ['setup'],
  },
  {
    name: 'chromium-no-auth',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'production-smoke',
    use: { baseURL: 'https://hemera.academy' },
    testMatch: /production-smoke\.spec\.ts/,
  },
]
```

**tests/e2e/auth-setup.ts**:
```typescript
// Playwright auth state setup
// Logs in via Clerk and saves storageState
```

### 1.3 Production Smoke Workflow

**.github/workflows/production-smoke.yml**:
```yaml
name: Production Smoke Tests
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
  workflow_dispatch: {}

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx playwright test --project=production-smoke
      # Alert on failure (Slack/Email)
```

### 1.4 Course-Detail Timeout Fix

**tests/e2e/course-detail.spec.ts**:
- Warmup: Health-Endpoint vor Navigation aufrufen
- Timeout: 120s für Course-Detail Tests
- Remove `test.describe.skip()`

### 1.5 Console.log Audit Scope

| Directory | Approach |
|-----------|----------|
| `app/api/**` | `console.error` → `serverInstance.error()` |
| `lib/services/**` | `console.log` → entfernen oder `rollbar.info()` |
| `lib/monitoring/**` | Ausnahme (Rollbar-Setup) |
| `components/**` | `console.error` in Error Boundaries → `useRollbar().error()` |
| `tests/**` | Keine Änderung |
| `scripts/**` | Keine Änderung |

### 1.6 Contract Tests (No new APIs)

Dieses Feature erstellt keine neuen APIs - es aktiviert/repariert bestehende Tests.

**Bestehende Contract Tests bleiben unverändert:**
- `tests/contracts/stripe-checkout.spec.ts`
- `tests/contracts/stripe-webhook.spec.ts`
- `tests/contracts/bookings-api.spec.ts`

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

1. **Quick Wins** (Issue #357, tsconfig.json)
2. **Configuration** (jest.config.ts, biome.json, playwright.config.ts)
3. **CI/Workflow** (production-smoke.yml, coverage reporting)
4. **Auth Setup** (Playwright auth state, Clerk secrets)
5. **Test Fixes** (Issue #384 course-detail, checkout auth tests)
6. **Console.log Audit** (Rollbar migration per directory)
7. **New E2E Tests** (invoice-download, production-smoke)
8. **Verification** (Coverage report, CI green)

**Ordering Strategy**:
- TDD: Config changes enable tests first
- Dependencies: Auth setup before auth-dependent tests
- Parallel [P]: Console.log migration per directory

**Estimated Output**: ~20 tasks

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
