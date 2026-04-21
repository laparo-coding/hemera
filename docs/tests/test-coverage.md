# Test Coverage Workflow

Stand: 2026-04-18

## Ziel

Feature 028 erhöht die messbare Testabdeckung in drei ersten Critical Areas:

- Backend-Logik in `lib/services/booking.ts` und `lib/services/prerequisite.ts`
- API-Verhalten rund um Buchungen und Pending-Reviews
- Authenticated dashboard journeys und ihre zentralen Komponenten

Die Steuerung erfolgt bewusst nicht mehr über starre Alt-Thresholds direkt in Jest, sondern über:

1. kataloggestützte Coverage-Slices unter `tests/coverage/`
2. `coverage/coverage-summary.json` als maschinenlesbare Quelle
3. `npm run coverage:summary` für die Auswertung
4. `npm run coverage:check` für baseline-basierte Gates

## Lokale Kommandos

```bash
npm run test:unit:coverage -- --runInBand
npm run coverage:summary -- --json
npm run coverage:check -- --lines 60 --statements 60 --functions 45 --branches 75
```

## Runner-Struktur

- Unit-Tests: `npm run test:unit`
- Contract-Tests: `npm run test:contracts`
- Integration-Tests: `npm run test:integration`
- E2E-Tests:
  - Gesamtlauf: `npm run test:e2e`
  - Public-Slice: `npm run test:e2e:public`
  - Auth-User-Slice: `npm run test:e2e:auth-user`
  - Auth-Admin-Slice: `npm run test:e2e:auth-admin`
  - Performance-Slice: `npm run test:e2e:performance`

Hinweis:

- Die neue Contract- und Integration-Konfiguration trennt die Runner sauber vom Unit-Setup.
- Playwright-basierte Dateien unter `tests/integration/` werden im Jest-Integration-Runner explizit
  ignoriert, damit nur echte Jest-Integrationsspecs dort laufen.
- Die getrennte Playwright-Matrix ist lokal bereits fuer `public`, `chromium-auth`, `auth-admin`
  und `performance` bestaetigt; verwende fuer Debug- und Regressionslaeufe bevorzugt den kleinsten
  passenden Slice statt eines breiten Gesamtlaufs.

## Coverage-Katalog

Die Planungs- und Gate-Daten liegen unter `tests/coverage/`:

- `coverage-baseline.ts`
- `critical-areas.ts`
- `coverage-targets.ts`
- `test-workstreams.ts`
- `quality-gates.ts`

Diese Dateien definieren, welche Bereiche zuerst gemessen, verbessert und später härter gegated
werden.

## CI-Verhalten

- Pull Requests erzeugen eine Unit-Coverage-Summary und prüfen einen baseline-basierten Mindestwert.
- Deployments erzeugen dieselbe Summary erneut und blocken bei Unterschreitung der Gate-Werte.
- Die Gate-Werte sind bewusst konservativ an der real gemessenen Ausgangslage ausgerichtet und nicht
  frei geraten.

## Aktuell priorisierte Critical Areas

1. `lib/services/booking.ts`
2. `lib/services/prerequisite.ts`
3. `app/api/bookings/route.ts`
4. `app/api/bookings/[bookingId]/invoice/route.ts`
5. `app/api/admin/bookings/pending/route.ts`
6. `components/dashboard/UserPageContainer.tsx`
7. `components/dashboard/UserBreadcrumb.tsx`

## Nächste sinnvolle Erweiterungen

- zusätzliche kataloggestützte Gates pro Critical Area statt nur globaler Floors
- Coverage-Zusammenführung aus Unit-, Contract- und später auch API-nahen Läufen
- gezielte CI-Anbindung der getrennten Playwright-Slices, damit Public-, User-, Admin- und
  Performance-Signale auch im Workflow separat sichtbar bleiben