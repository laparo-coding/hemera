# Feature 022: Test Coverage

## Status

🟡 Draft

## Overview

Extend und stabilize die E2E- und Unit-Test-Suite für Hemera. Dieses Feature umfasst:
- Stripe-Integration Tests im Testmodus
- Invoice-Download Tests
- Production-Login-Tests mit Clerk Test-User
- Behebung bestehender CI-Probleme
- Setup für React Component Testing

## Clarifications

### Session 2026-01-28

- Q: Soll der Production-Login-Test in die reguläre CI-Pipeline integriert werden? → A: Nein, als separater Scheduled Job (täglich) mit Alerting bei Fehlschlag
- Q: Welche Test-Coverage-Schwelle soll als Ziel definiert werden? → A: 70% global, 85% für lib/services/ (kritische Business-Logik)
- Q: Sollen Stripe Webhook-Events in E2E-Tests simuliert werden? → A: Nein, Webhook-Tests bleiben in Contract/Unit-Tests (bereits vorhanden in `tests/contracts/stripe-webhook.spec.ts`)

## User Stories

1. **Als Entwickler** möchte ich E2E-Tests für Stripe-Zahlungen im Testmodus haben, damit ich Checkout-Flows sicher testen kann.
2. **Als Entwickler** möchte ich Rechnungsdownload-Tests haben, damit ich sicherstellen kann, dass Kunden ihre Rechnungen abrufen können.
3. **Als Entwickler** möchte ich Production-Login-Tests haben, damit ich kritische Auth-Flows auf der Live-Umgebung verifizieren kann.
4. **Als Entwickler** möchte ich React-Component-Tests schreiben können, damit ich UI-Komponenten isoliert testen kann.

## Requirements

### Functional Requirements

#### FR-1: Stripe Testmode E2E Tests
- E2E-Tests auf dev-Umgebung mit Stripe Testmode
- Verwendung von Clerk Test-User für Authentifizierung
- Test-Kreditkartennummern (z.B. `4242 4242 4242 4242`)
- Checkout-Flow End-to-End verifizieren
- **Scope:** E2E testet bis Checkout-Redirect; Webhook-Verarbeitung wird in Contract-Tests abgedeckt

#### FR-2: Invoice Download Tests
- Test des Rechnungsdownloads von Stripe im Testmodus
- Verifizierung, dass PDF erfolgreich generiert wird
- Test mit authentifiziertem Clerk Test-User

#### FR-3: Production Login Tests
- Login-Test auf Production-Umgebung
- Verwendung von Clerk Test-User
- Smoke-Test für kritische Auth-Flows
- Keine destructive Operationen auf Production
- **Ausführung:** Separater Scheduled Job (täglich, nicht in regulärer CI-Pipeline)
- **Alerting:** Benachrichtigung bei Fehlschlag (Slack/E-Mail)

#### FR-4: Issue #384 - Course-Detail E2E Tests reparieren
- **Problem:** E2E-Tests für `/courses/[slug]` schlagen mit Timeout auf CI fehl
- **Ursache:** SSR-Performance, Datenbank-Latenz, oder Cold-Start Probleme
- **Lösung:** CI-Runner-Performance analysieren, SSR optimieren, Tests wieder aktivieren
- **Betroffene Tests:** `tests/e2e/course-detail.spec.ts` (9 Tests, derzeit mit `test.describe.skip()` deaktiviert)

#### FR-5: Issue #357 - React Component Testing Setup
- Dependencies installieren: `@testing-library/react`, `@testing-library/jest-dom`, `jest-environment-jsdom`
- Jest-Config für React-Tests erweitern (`testEnvironment: 'jsdom'`, `*.spec.tsx` in `testMatch`)
- `tests/setup.ts` für Jest-DOM Matchers erweitern
- `tsconfig.json` anpassen (Component-Tests aus exclude entfernen)
- **Test-Dateien zu aktivieren:**
  - `tests/unit/components/course-detail/BookingCTA.spec.tsx`
  - `tests/unit/components/course-detail/CourseHeroSection.spec.tsx`
  - `tests/unit/components/course-detail/CourseOverviewSection.spec.tsx`
  - `tests/unit/components/course-detail/CurriculumSection.spec.tsx`
  - `tests/unit/components/course-detail/DatesPricingSection.spec.tsx`
  - `tests/unit/components/course-detail/TestimonialsSection.spec.tsx`

#### FR-6: Missing Tests Audit
- Audit der bestehenden Test-Coverage
- Identifizierung fehlender Tests für kritische Flows
- Priorisierung und Implementierung fehlender Tests

#### FR-7: Console.log durch Rollbar Logging ersetzen
- **Audit:** Alle `console.log`, `console.warn`, `console.error` im Produktionscode identifizieren
- **Ersetzung:** Durch entsprechende Rollbar-Methoden ersetzen:
  - `console.log` → `rollbar.info()` oder entfernen (wenn nur Debug)
  - `console.warn` → `rollbar.warning()`
  - `console.error` → `rollbar.error()`
- **Ausnahmen:** Test-Dateien, Scripts, Build-Tools bleiben unverändert
- **Betroffene Verzeichnisse:**
  - `app/` - API Routes und Pages
  - `lib/` - Services und Utilities
  - `components/` - React Components (nur Error-Handling)
- **Lint-Regel:** ESLint/Biome Regel für `no-console` in Production-Code aktivieren

### Non-Functional Requirements

- E2E-Tests müssen in unter 5 Minuten auf CI abschließen
- Stripe-Tests dürfen keine echten Transaktionen auslösen
- Production-Tests dürfen keine Daten modifizieren
- Test-Flakiness unter 5% halten
- **Test-Coverage-Schwelle:** 70% global als CI-Gate, 85% für `lib/services/`
- Coverage-Report in PR-Kommentaren (jest-coverage oder codecov)

## Acceptance Criteria

- [ ] Stripe Checkout E2E-Test läuft erfolgreich auf dev
- [ ] Invoice Download Test verifiziert PDF-Generierung
- [ ] Production Login Test authentifiziert Test-User
- [ ] Course-Detail E2E-Tests (#384) wieder aktiviert und stabil
- [ ] React Component Tests (#357) laufen mit `npm test`
- [ ] Jest-DOM Matchers funktionieren (`toBeInTheDocument`, `toHaveStyle`, etc.)
- [ ] Component-Test-Stubs aus tsconfig exclude entfernt
- [ ] CI läuft vollständig grün
- [ ] Test-Coverage Report zeigt keine kritischen Lücken
- [ ] Keine `console.log/warn/error` im Produktionscode (app/, lib/, components/)
- [ ] Rollbar-Logging für alle relevanten Error/Warning-Fälle implementiert
- [ ] Biome/ESLint `no-console` Regel für Production-Code aktiv

## Technical Considerations

### Stripe Testmode
- Stripe Secret Key: `STRIPE_SECRET_KEY` (Testmode-Key beginnt mit `sk_test_`)
- Test-Karten: https://stripe.com/docs/testing#cards
- Webhook-Simulation für Post-Payment Flows

### Clerk Test-User
- Dedizierter Test-User in Clerk Dashboard anlegen
- Credentials in CI-Secrets speichern
- E2E_TEST_EMAIL und E2E_TEST_PASSWORD Environment Variables

### Production Tests
- Nur lesende Operationen
- Separate Test-User mit minimalen Berechtigungen
- Playwright `--project=production` Konfiguration

### CI-Performance (Issue #384)
- GitHub Actions Runner Ressourcen analysieren
- Next.js Build-Cache optimieren
- Database Connection Pooling prüfen

## Dependencies

- Clerk Test-User Account
- Stripe Testmode API Keys
- Vercel Preview Deployments für dev-Tests
- Production-Zugang für Smoke-Tests

## Related Issues

- [#384](https://github.com/Laparo/hemera/issues/384): E2E: Course-Detail Tests wegen CI-Timeout deaktiviert
- [#357](https://github.com/Laparo/hemera/issues/357): Setup React component testing with Jest and Testing Library

## Open Questions

*Alle Fragen geklärt in Session 2026-01-28.*
