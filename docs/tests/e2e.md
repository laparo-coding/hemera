# E2E-Tests (Playwright)

Dieser Ordner enthält End-to-End-Tests mit Playwright. Die Tests validieren u. a. die API-Contracts
und grundlegende Flows.

## Installation

```bash
npm install
npm run e2e:install
```

## Lokal ausführen

### VS Code: PLAYWRIGHT-Tab vs. CLI-Tasks

- Die Tasks aus [.vscode/tasks.json](.vscode/tasks.json) starten Playwright als normale CLI-Läufe im
  Terminal.
- Diese Läufe erscheinen nicht als aktiver Lauf im PLAYWRIGHT-Tab von VS Code.
- Das gilt auch für `npm run test:e2e:ui`: Dieser Befehl startet den Playwright-UI-Mode, nicht den
  VS-Code-Test-Explorer.
- Wenn du einen Lauf im PLAYWRIGHT-Tab sehen willst, starte ihn in VS Code direkt über die
  Test-Ansicht oder den Playwright-Explorer.

- Server lokal starten oder Preview-URL nutzen.
- Standardmäßig wird `http://localhost:3000` als Base-URL genutzt. Du kannst eine externe URL
  setzen:

```bash
PLAYWRIGHT_BASE_URL=https://hemera-<preview>.vercel.app npm run e2e:dev
```

Wenn lokal bereits ein passender Server auf Port 3000 läuft und nur ein einzelner Spec-Lauf gegen
den bestehenden Server ausgeführt werden soll, setze `PLAYWRIGHT_BASE_URL` explizit. Dann startet
Playwright keinen zweiten Webserver:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/dashboard.spec.ts --project=public
```

Fuer lokale Admin- und Material-Slices mit realen Datensaetzen gibt es einen additiven Seed, der
bestehende lokale Daten nicht loescht. Er legt die fuer die aktuellen authentifizierten User- und
Admin-Szenarien benoetigten Kurse und Seminarmaterialien per Upsert an:

```bash
npm run db:seed:e2e-local
```

Der Seed arbeitet additiv per Upsert und loescht keine bestehenden Daten. In einer echten
Produktionsumgebung (`VERCEL_ENV=production`) bricht er ab; bei nicht-lokalen, aber lokal
aufgerufenen Entwicklungsdatenbanken gibt er nur einen Warnhinweis aus.

### Clerk-Testuser explizit erzeugen

- Das globale Playwright-Setup erzeugt Clerk-Testuser nicht mehr automatisch.
- Die Erstellung läuft nur, wenn `E2E_CREATE_USERS=true` explizit für einen lokalen Lauf gesetzt ist.
- In CI wird die Erstellung auch dann übersprungen, wenn das Flag gesetzt wäre.
- Wenn das Flag fehlt, eine CI-Umgebung erkannt wird oder `CLERK_SECRET_KEY` beziehungsweise `E2E_TEST_PASSWORD`
  fehlen, wird das sicher geloggt und
  übersprungen.

Beispiel für einen expliziten lokalen Lauf:

```bash
E2E_CREATE_USERS=true CLERK_SECRET_KEY=sk_test_xxx E2E_TEST_PASSWORD='<lokales-test-passwort>' npx playwright test
```

Empfohlen ist der Build-Modus:

```bash
npm run e2e
```

Dieser Befehl baut die App (`next build`) und führt anschließend die Tests aus (`playwright test`).

## Projektmatrix

Die Playwright-Konfiguration ist nach Laufarten getrennt:

- `public`: anonyme Seiten, SEO, Redirects und read-only UI-Diagnostik
- `chromium-auth`: authentifizierte User-Flows wie Dashboard, Checkout und Rechnungsdownload
- `auth-admin`: Admin-Flows wie Dashboard, Nutzerverwaltung, Reports und Admin-Locations
- `performance`: Performance- und Core-Web-Vitals-Spezifikationen
- `production-smoke`: read-only Checks gegen Produktion

Empfohlene Projektbefehle:

```bash
npm run test:e2e:public
npm run test:e2e:auth-user
npm run test:e2e:auth-admin
npm run test:e2e:performance
npm run test:e2e:smoke
```

### Aktuell bestätigter lokaler Stand

Stand: 2026-04-18, gegen einen laufenden lokalen Server auf `http://localhost:3000`.

- `public`: PASS (`21 passed`, `21 skipped`)
- `chromium-auth`: PASS (`55 passed`, `10 skipped`)
- `auth-admin`: PASS (`63 passed`, `23 skipped`)
- `performance`: PASS (`19 passed`, `0 failed`)

Nachverifikation am 2026-04-20:

- `auth-admin` wurde nach der letzten Admin-Autorisierungsanpassung erneut voll bestätigt (`63 passed`, `23 skipped`).
- Die nachgelagerten Qualitätschecks für diesen Stand liefen ebenfalls grün: `npm run typecheck`, `npm run lint` und ein fokussierter Jest-Lauf für Reports-, Courses- und Monitoring-Slices.

Hinweis: Nach der Projektaufteilung ist diese Matrix der maßgebliche Referenzstand. Ältere Aussagen
zu einem einzelnen Gesamtlauf unter `chromium-auth` sind dafür nicht mehr autoritativ.

## In CI (GitHub Actions)

- Workflow `.github/workflows/e2e.yml` führt die E2E-Tests gegen eine angegebene Base-URL aus.
- Übergib die Preview-URL als Eingabe oder setze environment `PLAYWRIGHT_BASE_URL` aus
  vorangegangenen Jobs.

### Vercel-Preview: E2E-Variablen setzen

Für die Auth-E2E-Flows müssen in der Vercel-Preview-Umgebung folgende Variablen gesetzt sein:

- `E2E_EMAIL_CAPTURE` (z. B. `1` zum Aktivieren des Magic-Link-Captures in eine Datei unter `/tmp`)
- `E2E_AUTH` (leer oder `credentials` für den Test-Login)
- `E2E_TEST_PASSWORD` (nur relevant, wenn `E2E_AUTH=credentials`)

Automatisiert geht das über den Workflow `.github/workflows/vercel-e2e-env.yml` (manuell startbar).
Voraussetzung sind Repository-Secrets:

- `VERCEL_TOKEN` – Vercel Access Token
- `VERCEL_ORG_ID` – Team/Org ID
- `VERCEL_PROJECT_ID` – Projekt-ID

Nach dem Setzen der Variablen ist ein neues Preview-Deployment nötig, damit die Änderungen aktiv
werden.

Hinweis: Der Lighthouse-Workflow setzt bereits `PREVIEW_URL`. Der E2E-Workflow kann diese übernehmen
oder selbst auf `deployment_status` lauschen und die `target_url` direkt ziehen.

## Hinweise

- Die Tests verwenden den Playwright APIRequestContext (`request` fixture) für API-Checks.
- Für Previews mit per-PR-Schema nutzt die App automatisch `hemera_pr_<PR_ID>` (kein `schema` in der
  Vercel-DSN nötig).

### Update (Okt 2025): Checkout-Routing und Redirect

- Die Buchungs-CTA auf der Kursdetailseite führt direkt zum Checkout unter
  `/checkout?courseId=<slug|id>`.
- Nicht angemeldete Nutzer:innen werden vom Checkout aus zu `/sign-in?redirect_url=<checkout-url>`
  umgeleitet und kehren nach dem Login in den Checkout zurück.
- Tests, die den Redirect prüfen, sollten deshalb die `redirect_url` auf den Checkout erwarten
  (Param-Name bleibt `courseId`, der Wert kann ein Slug sein).

### Auth-Flows (E2E)

- Gespeicherter Auth-State für authentifizierte Projekte
  - Die Projekte `chromium-auth` und `auth-admin` erwarten eine Datei `.auth/user.json`.
  - Wenn diese Datei fehlt, schlagen auth-basierte Specs früh mit `ENOENT` fehl.
  - Für lokale Einzeltests ohne vorbereiteten Auth-State nutze bevorzugt `public` oder einen
    explizit gesetzten `PLAYWRIGHT_BASE_URL` gegen einen bereits vorbereiteten Server.

- Email Magic Link (Capture)
  - Setze `E2E_EMAIL_CAPTURE=1` in der App-Umgebung (z. B. Vercel Preview oder lokal), damit die App
    den Magic-Link nach `/tmp/hemera-e2e-last-magic-link.txt` schreibt.
  - Stelle sicher, dass `NEXTAUTH_URL` der Base-URL entspricht (auch in Previews!).
  - Test: `tests/e2e/auth-email.spec.ts` (übersprungen, wenn `E2E_EMAIL_CAPTURE` nicht gesetzt ist).

- Credentials (nur Test-Modus)
  - Setze `E2E_AUTH=credentials` und optional `E2E_TEST_PASSWORD` (Default: `password`).
  - Test: `tests/e2e/auth-credentials.spec.ts` (übersprungen, wenn `E2E_AUTH` nicht `credentials`
    ist).
  - Hinweis: Der Credentials-Provider wird nur im Testmodus aktiviert und ist nicht für Produktion
    gedacht.

### Flaky/Fail-Fast

- Retries sind in CI auf 2 gesetzt. Passe `retries` in `playwright.config.ts` an.
- Du kannst die Projektmatrix erweitern (bspw. `webkit`, `firefox`) oder parallelisieren
  (`fullyParallel`).
- Für gezielte Debug-Läufe bevorzuge projektbezogene Commands statt die Gesamtsuite.
- Fail-Fast in CI: Der E2E-Workflow kommentiert Ergebnisse und bricht am Ende ab, wenn Tests
  fehlgeschlagen sind; Logs/Report werden als Artifact hochgeladen.

### Stabilitätsrichtlinien (lokal)

Um lokale Flakiness in Verbindung mit dem Next.js Dev-Server, Hot-Reloads und Datenbank-Poolgrenzen
zu minimieren, gelten folgende Richtlinien und Defaults:

- Navigation: Verwende in E2E-Tests bevorzugt `waitUntil: 'domcontentloaded'` statt `networkidle`.
  - Hintergrund: `networkidle` kann bei Dev-Servern und Analytics/Font-Requests länger blockieren
    und zu Timeouts führen.
  - Beispiele sind bereits angepasst in `tests/e2e/academy.spec.ts`, `courses-empty-state.spec.ts`,
    `course-detail-soldout.spec.ts`, `build-info.spec.ts` und in den Navigationsmessungen von
    `performance.spec.ts`.
- Concurrency: Reduzierte Workerzahl lokal in `playwright.config.ts` (`workers: 3`, in CI `4`).
  - Hintergrund: Prisma-Verbindungs-Pool (z. B. 13 Verbindungen) kann bei zu hoher Parallelität
    Timeouts werfen (`P2024: Timed out fetching a new connection`).
- Performance-Grenzwerte lokal:
  - FID-Schwelle (First Input Delay) in `performance.spec.ts` lokal auf 2.5s angehoben; in CI bleibt
    2s.
  - LCP-Navigationen messen wir nach `domcontentloaded`, um realistische, aber stabilere Zeiten zu
    erfassen.
- Warmup: Wenn nötig, vor kritischen Assertions eine kurze “Warmup”-Navigation durchführen oder
  Inhalte erst nach Sichtbarkeit (`toBeVisible`) prüfen.

Diese Anpassungen zielen darauf ab, die Aussagekraft der Tests zu erhalten und gleichzeitig typische
lokale Störfaktoren zu entschärfen. Für CI bleiben strengere Grenzen und parallele Ausführung
erhalten.

### Cheatsheet: stabile Navigationen und Klicks

```ts
// tests/e2e/helpers/nav.ts bereitgestellt:
import { gotoStable, clickAndWait } from './helpers/nav';

// 1) Stabile Navigation zu einer Seite
await gotoStable(page, '/courses', { waitForTestId: 'course-overview' });

// 2) Client-Side Routing per Klick + URL-Erwartung
const overview = page.getByTestId('course-overview');
const detailLink = overview.getByRole('button', { name: /zum kurs/i }).first();
await clickAndWait(page, () => detailLink, { expectUrl: /\/courses\/[\w-]+/ });

// 3) CTA klicken und Redirect erwarten (z. B. zu /sign-in)
const bookCta = page.getByTestId('course-detail-book-cta');
await clickAndWait(page, () => bookCta, { expectUrl: /\/sign-in\?redirect_url=/ });

// 4) Performance: vor FID-Messung Hydration beruhigen
await page.waitForTimeout(500);
const start = Date.now();
await page.locator('button, a').first().click();
const fid = Date.now() - start;
```

### Do/Don't: Navigations-Waits

#### Do

- `gotoStable(page, path, { waitForTestId })` nutzen; Standard-Wait ist `domcontentloaded` und ist
  im Dev-Server deutlich stabiler.
- Einen stabilen Anker via `waitForTestId` setzen (siehe Tabelle unten), statt auf beliebige
  Selektoren zu warten.
- Für Client-Side Routing `clickAndWait(page, () => locator, { expectUrl, waitForTestId })`
  einsetzen.
- Bei speziellen Seiten (z. B. Error Boundaries) die Assertion-Timeouts (z. B. 10s) erhöhen, da nach
  einem intentional Crash Rendering verzögert sein kann.

#### Don't

- Kein `waitUntil: 'networkidle'` im Dev-Modus verwenden (Next.js Dev-Server, Fonts, Analytics, Hot
  Reload etc. halten Verbindungen offen und führen zu Timeouts/Flakiness).
- Keine harten Sleeps als Standardmechanik einsetzen. Wenn nötig, kleine gezielte Pausen (z. B.
  500ms vor FID-Messung) sparsam nutzen und dokumentieren.
- Nicht auf fragile Selektoren warten (z. B. rein optische Klassen). Bevorzuge `data-testid` oder
  semantische Rollen in Kombination mit eindeutigem Namen.

### Adoption in bestehenden Specs

- Die SEO-Spezifikationen (z. B. `seo-*.spec.ts`) nutzen `gotoStable` und, wo sinnvoll,
  `clickAndWait` für Detail-Navigationen.
- Redirect-Tests (`redirect-legacy-protected.spec.ts`, `protected-legacy-redirect.spec.ts`)
  verwenden `gotoStable` und prüfen anschließend die finale URL.
- Der Error-Boundary-Test (`error-boundary.spec.ts`) navigiert mit `gotoStable` zur Crash-Seite und
  hat erhöhte Timeouts für die UI-Assertionen, um Render-Verzögerungen nach dem intentional Crash
  aufzufangen.

### Typische waitForTestId pro Seite

Verwende nach Möglichkeit ein stabiles, semantisches Test-ID-Element als Anker nach der Navigation.
Die folgende Tabelle listet häufige Seiten/Flows und geeignete `data-testid`-Werte:

| Seite/Route                      | waitForTestId                                      | Hinweis                                                                                                    |
| -------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Home `/`                         | `build-info`                                       | Badge rendert nach Hydration; eignet sich als allgemeiner Verfügbarkeitsindikator.                         |
| Kursliste `/courses`             | `course-overview`                                  | Warten, bis Kurs-Übersicht sichtbar ist; danach weitere Assertions.                                        |
| Kurse leer (DB-Empty-State)      | `e2e-courses-empty`                                | Der Public-Bereich zeigt nur DB-Daten; bei 0 Treffern gilt ausschließlich der explizite Empty-State.      |
| Kursdetail `/courses/[id\|slug]` | `course-detail-book-cta`                           | Für Interaktionstest; alternativ H1 prüfen, wenn keine CTA vorhanden.                                      |
| Ausgebucht-Detail                | `course-detail-sold-out-badge`                     | Optional zusätzlich `course-detail-disable-reason`.                                                        |
| Dashboard `/dashboard`           | `user-dashboard`                                   | Für Layout-/Navigationsprüfungen existieren zudem `dashboard-title`, `dashboard-nav`, `dashboard-metrics`. |
| Payment (vereinfachter Flow)     | `payment-flow`                                     | Weitere Hilfs-IDs: `payment-summary`, `payment-action`, `duplicate-warning`.                               |
| Redirect-Tests `/protected/*`    | –                                                  | Kein TestId nötig; finalen URL-Zustand prüfen.                                                             |
| Error-Boundary `/e2e/crash`      | –                                                  | Kein TestId verfügbar; erhöhte Timeouts bei Headline/Buttons verwenden.                                    |

Tipp: Wenn keine passende Test-ID existiert, favorisiere ein zentrales Landmark-Element (z. B.
`main` mit dedizierter `data-testid`) oder nutze in SEO-Tests das Vorhandensein von
`script[type="application/ld+json"]` als Stabilitäts-Anker.
