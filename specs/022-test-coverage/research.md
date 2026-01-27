# Feature 022: Test Coverage - Research

## Erstellt: 2026-01-28

## Inhaltsverzeichnis

1. [Aktuelle Test-Infrastruktur](#1-aktuelle-test-infrastruktur)
2. [Issue #384: Course-Detail E2E Timeout](#2-issue-384-course-detail-e2e-timeout)
3. [Issue #357: React Component Testing](#3-issue-357-react-component-testing)
4. [Stripe Test-Integration](#4-stripe-test-integration)
5. [Clerk Test-User Setup](#5-clerk-test-user-setup)
6. [Übersprungene Tests Audit](#6-übersprungene-tests-audit)
7. [Fehlende Test-Coverage](#7-fehlende-test-coverage)
8. [Empfehlungen](#8-empfehlungen)

---

## 1. Aktuelle Test-Infrastruktur

### Test-Frameworks

| Framework | Zweck | Config |
|-----------|-------|--------|
| **Jest** | Unit + Contract Tests | `jest.config.ts` |
| **Playwright** | E2E Tests | `playwright.config.ts` |
| **@testing-library/react** | Component Tests | Bereits installiert ✅ |
| **jest-environment-jsdom** | Browser-Umgebung | Bereits installiert ✅ |

### Test-Verzeichnisstruktur

```
tests/
├── contracts/           # API Contract Tests (18 Dateien)
├── e2e/                 # Playwright E2E Tests (38 Dateien)
├── integration/         # Integration Tests
├── unit/                # Jest Unit Tests
│   ├── actions/
│   ├── components/      # React Component Tests
│   │   ├── course-detail/  # 6 Test-Dateien ✅ funktionieren
│   │   ├── CourseCard.spec.tsx
│   │   ├── DashboardSection.spec.tsx
│   │   └── InvoiceDownloadButton.spec.tsx
│   ├── db/
│   └── services/
└── setup.ts             # Jest Setup (inkl. @testing-library/jest-dom)
```

### Jest-Konfiguration (Auszug)

```typescript
// jest.config.ts
testEnvironment: 'node',  // Default: node
transform: {
  '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: { jsx: 'react-jsx' } }],
},
testMatch: [
  '<rootDir>/tests/unit/**/*.spec.ts',
  '<rootDir>/tests/unit/**/*.spec.tsx',  // ✅ TSX bereits inkludiert
  '<rootDir>/tests/contracts/**/*.spec.ts',
],
setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],  // ✅ testing-library/jest-dom importiert
```

### Playwright-Konfiguration (Auszug)

```typescript
// playwright.config.ts
testDir: './tests/e2e',
workers: process.env.CI ? 4 : 3,
retries: process.env.CI ? 2 : 1,
timeout: 60000,
globalSetup: './tests/e2e/global-setup.ts',
webServer: {
  command: 'E2E_TEST=true NEXT_PUBLIC_DISABLE_CLERK=1 npm run dev',
  port: 3000,
  timeout: 180_000,
}
```

---

## 2. Issue #384: Course-Detail E2E Timeout

### Problem

Die E2E-Tests für `/courses/[slug]` schlagen auf GitHub Actions mit 60s Timeout fehl.

### Betroffene Datei

`tests/e2e/course-detail.spec.ts` - **9 Tests mit `test.describe.skip()` deaktiviert**

### Symptome

```
TimeoutError: page.goto: Timeout 60000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/courses/grundkurs", waiting until "load"
```

### Bereits versucht (fehlgeschlagen)

1. ❌ `waitUntil: 'domcontentloaded'`
2. ❌ Homepage-Warmup vor Navigation
3. ❌ Timeout auf 90s erhöht
4. ❌ `waitUntil: 'networkidle'`

### Mögliche Ursachen

| Ursache | Wahrscheinlichkeit | Investigation |
|---------|-------------------|---------------|
| SSR Cold Start | Hoch | Next.js Build-Cache prüfen |
| DB-Verbindung langsam | Mittel | Connection Pooling analysieren |
| CI Runner Ressourcen | Mittel | GitHub Actions Logs prüfen |
| Prisma Query Performance | Niedrig | Query Logging aktivieren |

### Empfehlung

1. **Warmup-Route implementieren**: Health-Endpoint vor Course-Tests aufrufen
2. **Build-Cache optimieren**: Next.js Cache zwischen CI-Runs persistieren
3. **Streaming SSR prüfen**: Course-Detail Page auf Streaming umstellen
4. **Timeout selektiv erhöhen**: Nur für Course-Detail auf 120s

---

## 3. Issue #357: React Component Testing

### Status: ✅ TEILWEISE GELÖST

### Dependencies

| Package | Status |
|---------|--------|
| `@testing-library/react` | ✅ Installiert |
| `@testing-library/jest-dom` | ✅ Installiert |
| `jest-environment-jsdom` | ✅ Installiert |

### Jest-Config

- ✅ `*.spec.tsx` in `testMatch` inkludiert
- ✅ JSX Transform konfiguriert (`tsconfig: { jsx: 'react-jsx' }`)
- ✅ `@testing-library/jest-dom` in `tests/setup.ts` importiert

### Test-Ergebnisse

Alle 6 Course-Detail Component Tests laufen erfolgreich:

```
PASS tests/unit/components/course-detail/BookingCTA.spec.tsx
PASS tests/unit/components/course-detail/CourseHeroSection.spec.tsx
PASS tests/unit/components/course-detail/CourseOverviewSection.spec.tsx
PASS tests/unit/components/course-detail/CurriculumSection.spec.tsx
PASS tests/unit/components/course-detail/DatesPricingSection.spec.tsx
PASS tests/unit/components/course-detail/TestimonialsSection.spec.tsx

Test Suites: 6 passed, 6 total
Tests:       43 passed, 43 total
```

### Verbleibende Aktion

**tsconfig.json Exclusion entfernen:**

```jsonc
// AKTUELL (zu entfernen):
"exclude": [
  ...
  "tests/unit/components/**/*.spec.tsx"  // ← Diese Zeile entfernen
]
```

---

## 4. Stripe Test-Integration

### Aktuelle Implementierung

`tests/e2e/checkout.spec.ts` enthält bereits Stripe-Test-Logik:

```typescript
const STRIPE_TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINE: '4000000000000002',
  REQUIRES_AUTH: '4000002500003155',
};

const isStripeTestMode = (): boolean => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  return key.startsWith('pk_test_');
};
```

### Vorhandene Tests

| Test | Status | Grund für Skip |
|------|--------|----------------|
| `should complete payment with test card` | ⏭️ Skipped | Erfordert Clerk Auth |
| `should handle declined card gracefully` | ⏭️ Skipped | Erfordert Clerk Auth |
| `should display Stripe payment form` | ⏭️ Skipped | Erfordert Clerk Auth |

### Problem

Tests werden in CI übersprungen weil:
1. `isCI() === true` → Clerk ist deaktiviert
2. Ohne Auth kein Zugriff auf `/checkout` (protected route)

### Lösungsansatz

1. **Dedizierter Clerk Test-User** mit echten Credentials in CI-Secrets
2. **Auth State Persistence** mit Playwright `storageState`
3. **Separate Playwright-Projekte**: `auth` und `no-auth`

### Invoice Download Tests

`tests/integration/api/bookings-invoice.spec.ts` existiert bereits:
- Testet `/api/bookings/[bookingId]/invoice` Endpoint
- Verifiziert Redirect zu Stripe PDF URL
- Verwendet Test-Daten mit `stripeInvoicePdfUrl`

---

## 5. Clerk Test-User Setup

### Aktuelle Konfiguration

`tests/e2e/auth-helper.ts`:

```typescript
const _TEST_CREDENTIALS = {
  USER_EMAIL: 'e2e.dashboard@example.com',
  USER_PASSWORD: 'E2ETestPassword2024!SecureForTesting',
  ADMIN_EMAIL: 'e2e.admin@example.com',
  ADMIN_PASSWORD: 'E2ETestPassword2024!SecureForTesting',
};
```

### CI-Mocking

In CI wird Auth gemockt statt echter Clerk-Login:

```typescript
private shouldMockAuth(): boolean {
  return (
    !!process.env.CI ||
    process.env.E2E_TEST === 'true' ||
    process.env.NEXT_PUBLIC_DISABLE_CLERK === '1'
  );
}
```

### Empfehlung für echte Auth-Tests

1. **Clerk Test Instance** mit dedizierten Test-Usern
2. **CI Secrets** für E2E_TEST_EMAIL / E2E_TEST_PASSWORD
3. **Playwright Auth Setup** mit `storageState` für Session-Persistence
4. **Production Smoke Tests** mit separatem Projekt

---

## 6. Übersprungene Tests Audit

### E2E Tests mit `test.skip()`

| Datei | Anzahl Skips | Grund |
|-------|--------------|-------|
| `course-detail.spec.ts` | 9 (ganzes describe) | CI Timeout (#384) |
| `checkout.spec.ts` | 8 | Clerk Auth erforderlich |
| `dashboard-sections.spec.ts` | 11 | Verschiedene Gründe |
| `admin-course-*.spec.ts` | 3 Dateien | Clerk Auth erforderlich |
| `locations.spec.ts` | 3 | API Auth erforderlich |
| `build-info.spec.ts` | 1 | Unbekannt |
| `error-boundary.spec.ts` | 1 | Unbekannt |
| `protected-legacy-redirect.spec.ts` | 1 | Unbekannt |

### Unit Tests mit `describe.skip()`

| Datei | Tests | Grund |
|-------|-------|-------|
| `testimonial-api.spec.ts` | POST Tests | Unbekannt |

### Zusammenfassung

- **~40 E2E Tests** sind übersprungen (primär wegen fehlender Clerk Auth in CI)
- **Hauptproblem**: CI kann keine echte Clerk-Authentifizierung durchführen

---

## 7. Fehlende Test-Coverage

### Kritische Flows ohne E2E-Coverage in CI

1. **Authentifizierter Checkout Flow** - Tests existieren, aber skipped
2. **Invoice Download im Browser** - Nur API-Tests, kein E2E
3. **Admin Booking Review** - Contract Tests vorhanden, E2E fehlt
4. **PRE_BOOKED Workflow** - Integration Tests vorhanden, E2E fehlt
5. **Course Recommendations** - Keine Tests

### Component Tests ohne Coverage

- `CourseRecommendationSection.tsx` - Neu hinzugefügt, keine Tests
- `BookingReviewDialog.tsx` - Admin Component, keine Tests
- `PendingBookingsTable.tsx` - Admin Component, keine Tests
- `UserOutperformerToggle.tsx` - Admin Component, keine Tests

### API Routes ohne Contract Tests

- `app/api/admin/users/[id]/route.ts` - Nur Integration Tests
- Learning Path APIs teilweise ungetestet

---

## 8. Empfehlungen

### Priorität 1: Quick Wins

1. **tsconfig.json bereinigen** - Component Test Exclusion entfernen
2. **Issue #357 schließen** - Bereits funktionsfähig

### Priorität 2: Issue #384 lösen

1. **CI Warmup implementieren** - Health-Check vor Course-Tests
2. **Playwright Project für Course-Detail** - Separates Projekt mit höherem Timeout
3. **SSR Performance analysieren** - Build-Time Logging aktivieren

### Priorität 3: Clerk Auth in CI

1. **Dedicated Test User** in Clerk Dashboard anlegen
2. **CI Secrets** für Credentials konfigurieren
3. **Playwright Auth State** mit `globalSetup` persistieren
4. **Neue Playwright Projekte**:
   - `chromium-auth` - Mit Clerk Login
   - `chromium-no-auth` - Bestehende Mock-Tests

### Priorität 4: Production Smoke Tests

1. **Separate Playwright Config** für Production
2. **Nur lesende Tests** - Login, Navigation, Kursansicht
3. **Scheduled GitHub Action** - Täglich oder bei Deployment
4. **Alerting** bei Fehlschlägen

### Priorität 5: Missing Tests

1. **Admin Components** - BookingReviewDialog, PendingBookingsTable
2. **Learning Path E2E** - PRE_BOOKED Flow end-to-end
3. **Invoice Download E2E** - Mit echtem PDF-Download

---

## Nächste Schritte

1. [ ] `tsconfig.json` Exclusion entfernen → Issue #357 schließen
2. [ ] CI Warmup für Course-Detail Tests implementieren
3. [ ] Clerk Test-User in Dashboard anlegen
4. [ ] Playwright Auth-Projekt konfigurieren
5. [ ] Plan.md und Tasks.md erstellen
