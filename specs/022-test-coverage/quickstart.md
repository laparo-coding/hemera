# Feature 022: Test Coverage - Quickstart

## Ziel

Aktiviere und stabilisiere die Test-Suite für Hemera mit 70% globaler Coverage.

## Voraussetzungen

- Node.js 20+
- Docker (für Testcontainers)
- Clerk Test-User Credentials (für E2E Auth)
- Stripe Testmode Keys

## Quick Start (5 Minuten)

### 1. Issue #357 lösen (Component Tests)

```bash
# tsconfig.json Exclusion entfernen
# Zeile entfernen: "tests/unit/components/**/*.spec.tsx"

# Verifizieren
npm run test -- tests/unit/components/
# Erwartung: 43+ Tests passed
```

### 2. Coverage Report aktivieren

```bash
# Jest Coverage laufen lassen
npm run test -- --coverage

# Erwartung: Coverage Report in /coverage/
# Ziel: 70% global, 85% für lib/services/
```

### 3. E2E Tests mit Auth laufen lassen (lokal)

```bash
# Clerk Secrets in .env.local setzen
E2E_TEST_EMAIL=e2e.dashboard@example.com
E2E_TEST_PASSWORD=<secure-password>

# E2E mit Auth
npx playwright test --project=chromium-auth
```

### 4. Console.log Audit

```bash
# Alle console.log/error im Production-Code finden
grep -r "console\.\(log\|error\|warn\)" app/ lib/ components/ --include="*.ts" --include="*.tsx" | wc -l

# Durch Rollbar ersetzen (siehe plan.md Abschnitt 1.5)
```

## Verifikation

| Check | Command | Erwartung |
|-------|---------|-----------|
| Component Tests | `npm test -- tests/unit/components/` | 43+ passed |
| Coverage | `npm test -- --coverage` | ≥70% |
| E2E (no-auth) | `npx playwright test --project=chromium-no-auth` | All passed |
| Lint (no-console) | `npm run lint` | 0 console.* in app/lib/components |

## Nächste Schritte

1. `/tasks` ausführen für detaillierte Task-Liste
2. Issue #384 (Course-Detail Timeout) mit Warmup-Strategie lösen
3. Production Smoke Workflow einrichten
