# Rollbar Local Checklist

Diese Checkliste fasst die verifizierten lokalen Rollbar-Setups für Gaia,
Hemera und Aither zusammen.

## Grundregeln

- Verwende für serverseitige Ingestion immer einen echten
  `post_server_item`-Secret-Token.
- Verwende für Browser-Telemetrie nur einen `post_client_item`-Token.
- Verwende niemals eine Rollbar Public ID als Secret-Token.
- Verwende keinen `read`, `write` oder MCP-Helfer-Token für den App-Runtime-
  Pfad.
- Halte Tokens repo-lokal in `.env.local`, nicht global in der Shell.

## Gaia

- Datei: `gaia/.env.local`
- Server-Token: `GAIA_ROLLBAR_ACCESS_TOKEN`
- Optionale Diagnostik: `GAIA_ROLLBAR_DIAGNOSTICS=true`
- Optionales Drain-Tuning: `GAIA_ROLLBAR_DELIVERY_WAIT_SECONDS=1`
- Lokaler API-Check:

```bash
cd gaia
token=$(grep '^GAIA_ROLLBAR_ACCESS_TOKEN=' .env.local | tail -n 1 | cut -d= -f2- | sed -E "s/^[[:space:]]*['\"]?//; s/['\"]?[[:space:]]*(#.*)?$//" | tr -d '[:space:]')
curl -sS https://api.rollbar.com/api/1/item/ \
  -H 'Content-Type: application/json' \
  -d "{\"access_token\":\"$token\",\"data\":{\"environment\":\"development\",\"level\":\"info\",\"body\":{\"message\":{\"body\":\"Gaia local receipt probe\"}}}}"
```

- Erwartung: Rollbar antwortet mit `"err": 0`.

## Hemera

- Datei: `hemera/.env.local`
- Server-Token: `ROLLBAR_HEMERA_SERVER_TOKEN`
- Optionaler Browser-Token: `NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN`
- Lokales Server-Opt-in: `ROLLBAR_ENABLED=1`
- Optionales Browser-Opt-in: `NEXT_PUBLIC_ROLLBAR_ENABLED=1`
- Wichtiger Hinweis: Zeitstempel-suffigierte Altvariablen in `.env.local`
  aktivieren Hemera nicht automatisch. Ihre Werte muessen in die kanonischen
  Namen kopiert werden.
- Lokaler API-Check:

```bash
cd hemera
token=$(grep '^ROLLBAR_HEMERA_SERVER_TOKEN=' .env.local | tail -n 1 | cut -d= -f2- | sed -E "s/^[[:space:]]*['\"]?//; s/['\"]?[[:space:]]*(#.*)?$//" | tr -d '[:space:]')
curl -sS https://api.rollbar.com/api/1/item/ \
  -H 'Content-Type: application/json' \
  -d "{\"access_token\":\"$token\",\"data\":{\"environment\":\"development\",\"level\":\"info\",\"body\":{\"message\":{\"body\":\"Hemera local receipt probe\"}}}}"
```

- Erwartung: Rollbar antwortet mit `"err": 0`.

## Aither

- Datei: `aither/.env.local`
- Server-Token: `ROLLBAR_SERVER_TOKEN`
- Optionaler Browser-Token: `NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN`
- Server-Opt-in: `ROLLBAR_ENABLED=1`
- Browser-Opt-in: `NEXT_PUBLIC_ROLLBAR_ENABLED=1`
- Wichtiger Hinweis: In Aither ist der Serverpfad jetzt von der Browser-
  Aktivierung getrennt. `NEXT_PUBLIC_ROLLBAR_ENABLED=0` schaltet den
  Serverpfad nicht mehr ab.
- Lokaler API-Check:

```bash
cd aither
token=$(grep '^ROLLBAR_SERVER_TOKEN=' .env.local | tail -n 1 | cut -d= -f2- | sed -E "s/^[[:space:]]*['\"]?//; s/['\"]?[[:space:]]*(#.*)?$//" | tr -d '[:space:]')
curl -sS https://api.rollbar.com/api/1/item/ \
  -H 'Content-Type: application/json' \
  -d "{\"access_token\":\"$token\",\"data\":{\"environment\":\"development\",\"level\":\"info\",\"body\":{\"message\":{\"body\":\"Aither local receipt probe\"}}}}"
```

- Erwartung: Rollbar antwortet mit `"err": 0`.

## Abschlusscheck

- Gaia: direkte Ingest-API akzeptiert Event
- Hemera: direkte Ingest-API akzeptiert Event
- Aither: direkte Ingest-API akzeptiert Event
