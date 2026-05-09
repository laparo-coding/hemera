# Hinweise zu E2E-Tests auf Preview-Deployments

- Vercel-Previews sind in der Regel SSO-geschützt (Clerk).
- Öffentliche Nutzer:innen sehen daher meist nur Fallback- oder Empty-State-Markup.
- E2E-Tests müssen tolerant gegenüber diesen Fallbacks sein und dürfen nicht auf echte Seed-Daten
  bestehen.
- Beispiel: Der Kurse-Test akzeptiert sowohl echte Kurskarten als auch den leeren Zustand oder ein
  Fallback-Markup.
- Siehe `tests/e2e/courses.spec.ts` für die konkrete Logik.

**Tipp:** Wenn du neue E2E-Tests schreibst, prüfe immer, ob sie auch auf einer SSO-geschützten
Preview sinnvoll durchlaufen können.

## Bypass für SSO-geschützte Previews (empfohlen statt SSO komplett zu deaktivieren)

Wenn Previews durch Vercel SSO geschützt sind, kannst du einen Protection-Bypass-Token verwenden:

1. In Vercel → Project → Settings → Protection → „Bypass Tokens“ einen Token erzeugen.
2. Diesen als Secret in GitHub hinterlegen. Repo nutzt dafür
  `VERCEL_PROTECTION_BYPASS`.
3. Playwright sendet den Header automatisch, wenn die Env-Var gesetzt ist:
  Header: `x-vercel-protection-bypass: <TOKEN>`.
  Local: `VERCEL_PROTECTION_BYPASS=<TOKEN> PLAYWRIGHT_BASE_URL=<Preview-URL> npx playwright test`.
  CI: `E2E: External Smoke` und `CI: Lighthouse` nutzen
  `VERCEL_PROTECTION_BYPASS`.

Damit laufen E2E-Tests gegen geschützte Previews ohne SSO global abzuschalten.

## SSO temporär deaktivieren (Alternative)

Falls du SSO kurzzeitig für Previews abschalten willst:

- Vercel → Project → Settings → Protection → „Preview Deployments“ → „Require Authentication / SSO“
  deaktivieren.
- Nach den Tests wieder aktivieren.

Beachte: Temporäres Abschalten erlaubt externe Zugriffe; der Bypass-Token ist in der Regel sicherer
und nachvollziehbarer.
