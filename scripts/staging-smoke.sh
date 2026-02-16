#!/usr/bin/env bash
# Einfache Smoke-Tests für Staging
# Nutzung: export STAGING_URL=https://staging.example.com && export SERVICE_USER_TOKEN=... && ./scripts/staging-smoke.sh
set -euo pipefail
: ${STAGING_URL:?STAGING_URL muss gesetzt sein}

REQID_PREFIX="smoke-$(date +%s)"

echo "1) Health check"
curl -fsS -i -H "X-Request-ID: ${REQID_PREFIX}-health" "${STAGING_URL}/api/health" || { echo "Health check failed"; exit 2; }

printf '\n2) Service: Liste Kurse (Service-User)\n'
if [ -z "${SERVICE_USER_TOKEN:-}" ]; then
  echo "WARN: SERVICE_USER_TOKEN nicht gesetzt — überspringe Service-API-Test"
else
  curl -fsS -i -H "Authorization: Bearer ${SERVICE_USER_TOKEN}" -H "X-Request-ID: ${REQID_PREFIX}-svc-courses" "${STAGING_URL}/api/service/courses" || { echo "Service /courses failed"; exit 3; }
fi

printf '\n3) Admin: geschützte Liste (nur prüfen, falls ADMIN_TOKEN gesetzt)\n'
if [ -z "${ADMIN_TOKEN:-}" ]; then
  echo "WARN: ADMIN_TOKEN nicht gesetzt — überspringe Admin-API-Test"
else
  curl -fsS -i -H "Authorization: Bearer ${ADMIN_TOKEN}" -H "X-Request-ID: ${REQID_PREFIX}-admin-courses" "${STAGING_URL}/api/admin/courses" || { echo "Admin /courses failed"; exit 4; }
fi

printf '\n4) Audit/ApiLog prüfen (letzte Einträge) — optional\n'
if [ -z "${ADMIN_TOKEN:-}" ]; then
  echo "WARN: ADMIN_TOKEN nicht gesetzt — überspringe ApiLog-Abfrage"
else
  curl -fsS -i -H "Authorization: Bearer ${ADMIN_TOKEN}" -H "X-Request-ID: ${REQID_PREFIX}-apilogs" "${STAGING_URL}/api/admin/apilogs?limit=3" || { echo "ApiLogs endpoint failed"; exit 5; }
fi

printf '\nSmoke-Tests abgeschlossen: OK\n'
exit 0
