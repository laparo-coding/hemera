# Test Coverage Baseline

Stand: 2026-04-18

## Ausgeführte Baseline-Kommandos

Diese Kommandos dokumentieren die historische Ausgangslage zu Beginn von Feature 028, also vor der
späteren Aufteilung der Playwright-Läufe in eine getrennte Projektmatrix.

```bash
npm run typecheck
npm run lint
npm test -- --coverage --coverageReporters=text --coverageReporters=lcov --coverageReporters=html --coverageReporters=json-summary --runInBand
npm run test:contracts -- --runInBand
npm run test:e2e -- --project=chromium-auth
```

## Ergebnisübersicht

| Bereich | Status | Beobachtung |
| ------- | ------ | ----------- |
| TypeScript | PASS | `npm run typecheck` lief erfolgreich durch. |
| Biome | PASS | `npm run lint` lief erfolgreich durch. |
| Jest Unit Coverage | FAIL | Test-Suites grün, aber Coverage-Gates reißen deutlich. |
| Contract-Tests | FAIL | `npm run test:contracts` findet aktuell keine Tests. |
| Playwright `chromium-auth` | FAIL | Historische Ausgangslage: Auth-State `.auth/user.json` fehlt, dadurch scheitern die auth-basierten Läufe früh. |

## Jest-Coverage-Baseline

Quelle: `coverage/coverage-summary.json`

### Totals

- Lines: 63.36%
- Statements: 63.36%
- Functions: 45.70%
- Branches: 78.03%

### Gegen aktuelle Gates

- Global `lines` und `statements` unter dem Soll von 70%
- Global `functions` deutlich unter dem Soll von 70%
- `lib/services` klar unter dem Soll von 85% bei allen Metriken außer teilweise Branches
- `lib/monitoring` unterschreitet das Function-Gate von 50%
- `./lib/stripe/` hat im Lauf keine Coverage-Daten geliefert

### Niedrige bzw. relevante Coverage-Kandidaten

Diese Liste kombiniert die JSON-Auswertung mit fachlicher Priorisierung statt nur stumpf nach einer
einzelnen Kennzahl zu sortieren.

- Backend-Logik:
  - `lib/services/booking.ts`
  - `lib/services/prerequisite.ts`
  - `lib/services/course.ts`
  - `lib/middleware/server-action-error-handling.ts`
- API-Verhalten:
  - `app/api/bookings/route.ts`
  - `app/api/bookings/[bookingId]/invoice/route.ts`
  - `app/api/admin/bookings/pending/route.ts`
- Dashboard / Authenticated Journeys:
  - `app/dashboard/page.tsx`
  - `app/my-courses/page.tsx`
  - `app/user-profile/[[...user-profile]]/page.tsx`
  - `components/dashboard/UserPageContainer.tsx`
  - `components/dashboard/UserBreadcrumb.tsx`

## Contract-Test-Baseline

`npm run test:contracts -- --runInBand` endet derzeit mit `No tests found`.

Beobachtung:

- Der Script-Eintrag in `package.json` zeigt auf `jest tests/contracts`
- `jest.config.ts` matcht aktuell aber nur `tests/unit/**/*.spec.ts` und `tests/unit/**/*.spec.tsx`
- Damit existiert ein echter Ausführungs-Gap zwischen beabsichtigtem Contract-Layer und aktiver
  Jest-Konfiguration

Folge für Feature 028:

- Die Contract-Ebene ist in der Planung vorhanden, aber lokal noch nicht korrekt an den Runner
  angeschlossen
- Dieser Gap ist Teil der Integrationsarbeit für die Coverage- und Quality-Gates

## Historische E2E-Ausgangslage vor Projektaufteilung

Dieser Abschnitt beschreibt bewusst die frühe Ausgangslage vor der späteren Trennung in `public`,
`chromium-auth`, `auth-admin` und `performance`. Der maßgebliche aktuelle Referenzstand steht weiter
unten im Dokument in der Matrix-Revalidierung.

`npm run test:e2e -- --project=chromium-auth` scheitert aktuell nicht primär an einzelnen
Produktfehlern, sondern an fehlender Auth-Testvorbereitung.

Beobachtung:

- Wiederkehrender Fehler: `Error reading storage state from .auth/user.json`
- Betroffen sind zahlreiche auth-abhängige Specs, unter anderem Dashboard-, Performance- und
  SEO-Läufe

Folge für Feature 028:

- Authenticated journey coverage kann sinnvoll erweitert werden
- Der lokale bzw. CI-stabile Aufbau des Auth-States ist aber Vorbedingung für belastbare E2E-Gates

### Revalidierung nach Auth-Setup-Fix und deaktivierter 2FA

Nach Korrektur von `tests/e2e/auth-setup.ts` und deaktivierter 2FA für den Clerk-Testnutzer ist der
ursprüngliche Auth-Blocker behoben.

- `E2E_TEST_EMAIL='e2e.test@example.com' E2E_TEST_PASSWORD='E2ETestPassword2024!SecureForTesting' npx playwright test tests/e2e/auth-setup.ts --project=setup`: PASS
- `.auth/user.json` wird lokal wieder erzeugt
- `npx playwright test tests/e2e/dashboard.spec.ts --project=chromium-auth --grep "display dashboard layout and navigation correctly|expose the primary dashboard navigation links"`: PASS
- `npm run test:e2e -- --project=chromium-auth`: FAIL, aber nicht mehr wegen fehlendem Auth-State

Historischer Stand des damaligen vollständigen `chromium-auth`-Laufs:

- 98 Tests PASS
- 53 Tests FAIL
- 4 Tests flaky
- 61 Tests skipped

Die verbleibenden Fehler liegen jetzt in separaten Altbaustellen, vor allem:

- Admin-E2E-Slices mit nicht erfüllten Admin-/Datenvoraussetzungen (`admin-users`, `admin-dashboard`, `admin-reports`, `admin-course-material`, `admin-course-publish-toggle`)
- veraltete Selector-/UI-Annahmen in einzelnen Auth-/Navigationstests (`authorization.spec.ts`, `production-smoke.spec.ts`)
- unabhängige Laufzeit-/Performance-Probleme in API-/Health-/Invoice-/Performance-Slices

## Erste kritische Arbeitsfelder

1. Backend-Logik in `lib/services/booking.ts` und `lib/services/prerequisite.ts`, weil dort sowohl
   fachlicher Wert als auch messbare Coverage-Lücken zusammenfallen.
2. API-Verhalten rund um Buchungen und Pending-Review-Flows, weil hierfür bereits Contract-Dateien
   existieren, der Runner aber aktuell nicht richtig greift.
3. Authenticated dashboard journeys, weil die Produktrelevanz hoch ist und die aktuelle E2E-Baseline
   schon auf einen infrastrukturellen Schwachpunkt zeigt.

## Offene Folgeentscheidungen

- Welche Teilmengen von `app/` und `components/` zuerst in `collectCoverageFrom` aufgenommen werden
- Welche Schwellenwerte nach der ersten Erweiterungswelle als Soft- oder Hard-Gates aktiviert werden
- Ob der Contract-Layer über Jest-Konfiguration, getrennte Jest-Config oder alternativen Runner klarer
  getrennt werden sollte

## Umgesetzte Folgeentscheidungen

Stand nach Feature-028-Implementierung:

- Unit-Coverage sammelt jetzt neben `lib/**/*.ts` auch die ersten kataloggestützten Dashboard-Critical-
  Areas (`components/dashboard/UserPageContainer.tsx`, `components/dashboard/UserBreadcrumb.tsx`).
- Contract- und Integration-Tests nutzen jetzt eigene Jest-Konfigurationen statt am Unit-Runner zu
  hängen.
- Pull-Request- und Deploy-Workflows erzeugen `coverage/coverage-summary.json`, rendern daraus eine
  maschinenlesbare Summary und prüfen baseline-basierte Floors über `npm run coverage:check`.

### Aktuelle Gate-Werte

- Lines: mindestens 60%
- Statements: mindestens 60%
- Functions: mindestens 45%
- Branches: mindestens 75%

### Aktuell bestätigter lokaler Stand

- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm run test:unit:coverage -- --runInBand`: PASS
- `npm run test:contracts -- --runInBand`: PASS
- `npm run coverage:check -- --lines 60 --statements 60 --functions 45 --branches 75`: PASS
- `npx jest --config jest.contract.config.ts --runInBand tests/contracts/coverage-gates.spec.ts`: PASS
- `npx jest --config jest.contract.config.ts --runInBand tests/contracts/bookings-api.spec.ts tests/contracts/admin-booking-pending.spec.ts`: PASS
- `npx jest --config jest.integration.config.ts --runInBand tests/integration/coverage-baseline.spec.ts tests/integration/coverage-workflow.spec.ts`: PASS
- `E2E_TEST_EMAIL='e2e.test@example.com' E2E_TEST_PASSWORD='E2ETestPassword2024!SecureForTesting' npx playwright test tests/e2e/auth-setup.ts --project=setup`: PASS
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=public --reporter=line`: PASS (`21 passed`, `21 skipped`)
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=chromium-auth --reporter=line`: PASS (`55 passed`, `10 skipped`)
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/admin-dashboard.spec.ts --project=auth-admin`: PASS (`10 passed`, `1 skipped`)
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/admin-users.spec.ts --project=auth-admin --reporter=line`: PASS (`9 passed`, `1 skipped`)
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/admin-api.spec.ts --project=auth-admin --reporter=line`: PASS (`11 passed`, `1 skipped`)
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=auth-admin --reporter=line`: PASS (`63 passed`, `23 skipped`)
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=performance --reporter=line`: PASS (`19 passed`, `0 failed`)

### Nachverifikation am 2026-04-20

- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm run test:unit:coverage -- --runInBand --detectOpenHandles tests/unit/app/admin/reports-page.spec.tsx tests/unit/api/courses.spec.ts tests/unit/monitoring/deployment-monitor.spec.ts tests/unit/monitoring/rollbar-validation.spec.ts tests/unit/rollbar-sampling.spec.ts`: PASS (`5 suites`, `18 tests`)
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=auth-admin --reporter=line`: weiterhin PASS (`63 passed`, `23 skipped`)

Die fünf fokussierten Unit-Suites wurden gewählt, weil sie die betroffenen kritischen Admin-, API-
und Monitoring-Slices repräsentativ abdecken. Für künftige Nachverifikationen sollte möglichst das
Script-Pattern oder ein passender npm-Einstieg verwendet werden statt dauerhaft hart kodierter
Dateipfade, damit Umbenennungen diese Referenz nicht still brechen.

### Aktuelle E2E-Revalidierung nach Projektaufteilung

Die frueheren Hinweise auf einen erfolgreichen Gesamtlauf unter `chromium-auth` sind nach der
Projektaufteilung nicht mehr autoritativ. Massgeblich ist jetzt die getrennte Matrix aus User-,
Admin- und Performance-Slice.

Aktuell belastbar bestaetigt sind:

- `public` ist lokal gruen; die 21 Skips bleiben projektbedingt oder absichtlich stillgelegte
  Diagnostik- bzw. Fixture-Slices.
- `chromium-auth` ist lokal gruen und bestaetigt den authentifizierten User-Slice separat vom
  Admin-Bereich.
- `auth-admin` ist lokal gruen; die zuvor inkonsistenten 401-Meldungen in den Admin-APIs wurden
  auf den gemeinsamen Auth-Helper vereinheitlicht.
- `performance` ist lokal voll gruen.

### Weiterhin bekannte Altlasten außerhalb des Feature-Slices

- Der volle Contract-Lauf ist inzwischen lokal gruen; Jest meldet danach nur noch einen
  Open-Handle-Hinweis ohne fehlschlagenden Exit-Code.
- Die fruehere Aussage, der volle `chromium-auth`-Lauf sei der massgebliche gruene Endzustand,
  ist nach der Projekttrennung veraltet und wurde durch die obige Matrix-Revalidierung ersetzt.

### Abschlussbewertung für Feature 028

- Die Feature-028-spezifischen Coverage-Runner, Gate-Skripte und die isolierte Performance-Suite
  sind lokal bestaetigt.
- Die nachgelagerte Playwright-Projektmatrix ist mit separaten Gruen-Signalen fuer `public`,
  `chromium-auth`, `auth-admin` und `performance` lokal bestaetigt.
- Die baseline-basierten Gate-Werte bleiben bei 60% Lines, 60% Statements, 45% Functions und 75%
  Branches.
