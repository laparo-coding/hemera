## Beschreibung

Kurze Zusammenfassung der Änderung. Was wurde getan und warum?

Fixes: #<Issue-Nummer> (optional)

## Änderungen

- [ ] Feature/Refactor/Bugfix (kurz beschreiben)
- [ ] Relevante Doku aktualisiert (README/Docs)
- [ ] Tests ergänzt/aktualisiert

## Checkliste

- [ ] Linting erfolgreich (`npm run lint:ci`)
- [ ] Typecheck erfolgreich (`tsc --noEmit` via CI)
- [ ] Unit-Tests grün (`npm run test:unit`)
- [ ] Contract-Tests grün (`npm run test:contracts`)
- [ ] Build erfolgreich (`npm run build`)
- [ ] E2E (falls relevant) grün

## Screenshots / GIFs

(optional)

## Breaking Changes

- [ ] Nein
- [ ] Ja – Migration/Manuelle Schritte erläutert:

## Risikobetrachtung / Rollback

Kurze Notiz, wie im Fehlerfall zurückgerollt werden kann.

## Weitere Hinweise

z. B. Migrationsbefehle, ENV-Variablen, Monitoring/Alerting-Hinweise

# Pull Request Template

## Summary

Describe the change. Link to specs/tasks.

## Checklist

- [ ] Quality Gates (lint, typecheck, build, tests) pass locally
- [ ] Live monitoring of Deploy workflow performed (Preview/Production) and status confirmed
- [ ] Deployment URL captured and artifacts (e.g., Playwright report) reviewed if present
- [ ] Branch hygiene executed or scheduled (obsolete branches removed after successful deploy)
- [ ] Docs updated (README / Runbooks) if behavior changed

## Screenshots / Links

- Deployment URL:
- Playwright report (if any):
- Related specs:
