# Staging Migration & Smoke-Test Checkliste

Kurzcheck bevor Du die `ApiLog`-Migration in Staging ausführst.

Wichtig: immer ein Backup erstellen bevor Du Migrationen in Staging/Prod laufen lässt.

Vorbereitung
- Stelle sicher, dass `STAGING_DATABASE_URL` korrekt gesetzt ist und Zugang besteht.
- Prüfe dass die Branch `feat/025-service-user-endpoints` gepusht ist.
- Setze Rollbar/Monitoring-Key in Staging (read-only / test-mode) — keine Produktions-Schlüssel in PRs.
- Optional: setze `FEATURE_SERVICE_RESPONSE_LEGACY=true` in Staging-Env, um alten Clients Kompatibilität zu geben.

1) Backup (Postgres dump)

```bash
export DATABASE_URL="$STAGING_DATABASE_URL"
pmkdir -p /tmp/hemera-backups
pg_dump "$DATABASE_URL" -Fc -f /tmp/hemera-backups/hemera-staging-$(date +%Y%m%d%H%M).dump
```

2) Migration anwenden

- Manuelle SQL (empfohlen, wenn Migration bereits als SQL vorliegt):
```bash
export DATABASE_URL="$STAGING_DATABASE_URL"
psql "$DATABASE_URL" -f prisma/migrations/20260215140000_add_api_log/migration.sql
```

- Oder Prisma-Migrate (wenn Migration im migrations-Ordner und history sauber):
```bash
export DATABASE_URL="$STAGING_DATABASE_URL"
npx prisma migrate deploy
```

3) Branch deployen
- Trigger Deinen CI/CD-Job oder nutze internes Deploy-Skript:
```bash
git push origin feat/025-service-user-endpoints
./scripts/deploy-to-staging.sh feat/025-service-user-endpoints
# oder: GH Action / CI trigger
```

Optional: Falls Eure CD-Plattform einen HTTP-Endpoint akzeptiert, setze `DEPLOY_ENDPOINT` und
`DEPLOY_TOKEN` (Secrets) und rufe den Endpoint an:

```bash
export DEPLOY_ENDPOINT="https://cd.example.com/api/deploy"
export DEPLOY_TOKEN="<bearer-token>"
curl -sSf -X POST "$DEPLOY_ENDPOINT" \
	-H "Authorization: Bearer $DEPLOY_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"ref":"feat/025-service-user-endpoints","actor":"your-username"}'
```

4) Smoke-Tests ausführen
- Setze benötigte Tokens in Deiner Shell:
```bash
export STAGING_URL="https://staging.example.com"
export SERVICE_USER_TOKEN="<service-user-token>"
export ADMIN_TOKEN="<admin-token>"
./scripts/staging-smoke.sh
```

Erwartetes Ergebnis
- `api/health` antwortet 200
- `api/service/courses` antwortet 200 für Service-User
- `api/admin/courses` antwortet 200 für Admin
- `api/admin/apilogs` zeigt kürzliche `ApiLog`-Einträge (falls vorhanden)

Rollback (falls Migration Probleme macht)
- Falls die Migration nicht rückgängig ist, verwende das Dump, um DB wiederherzustellen:
```bash
pg_restore -d "$STAGING_DATABASE_URL" /tmp/hemera-backups/hemera-staging-YYYYMMDDHHMM.dump
```

Zusätzliche Hinweise
- Wenn Du `FEATURE_SERVICE_RESPONSE_LEGACY` verwendest: teste beide Varianten (an/aus) um sicherzugehen, dass neue Clients und alte Clients korrekt bedient werden.
- Prüfe CI-Logs nach Deploy: Achte auf Liveness/Readiness-Probes, 5xx Errors, und DB-Fehlermeldungen (P2002 Unique constraint etc.).
- Nach erfolgreichem Smoke-Test: dokumentiere Ergebnisse im PR-Thread und schalte Feature-Flag planmäßig aus, falls nicht länger benötigt.

Wenn Du möchtest, schreibe ich auch eine GitHub Actions-Job-Definition, die Migration + Smoke-Tests automatisiert. Sag kurz "Erstelle GH Action" und ich lege die Datei an.