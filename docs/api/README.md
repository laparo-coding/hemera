# Hemera API Doku

> OpenAPI 3.1.0 Spezifikation & Postman Collection für alle 44 Endpoints

Diese Seite fasst die wichtigsten Schritte aus `specs/019-OpenAPI-Postman/quickstart.md` zusammen, damit du sofort loslegen kannst.

## Dateien

| Datei | Zweck |
|-------|-------|
| `openapi.yaml` | Vollständige OpenAPI 3.1.0 Spezifikation (Tags: Public, Auth, Bookings, Courses, Locations, Admin, Webhooks, Monitoring) |
| `hemera.postman.json` | Postman Collection v2.1 inkl. Ordnern nach Tags und globalen Pre-Request/Test-Skripten |
| `hemera.env.json` | Environment-Vorlage mit `baseUrl`, `bearer_token` und Test-IDs |

## Schritt 1: OpenAPI importieren

1. Öffne Postman → **File → Import** (oder den Import-Button).
2. Lade `docs/api/openapi.yaml` hoch.
3. Postman erstellt automatisch eine Collection, gruppiert nach Tags.

### Optional: Swagger UI

Wenn du lieber direkt in Swagger UI schauen möchtest, kannst du `openapi.yaml` z.B. auf https://editor.swagger.io ziehen.

## Schritt 2: Postman Collection & Environment

1. Importiere `docs/api/hemera.postman.json` (gleicher Dialog).
2. Importiere danach `docs/api/hemera.env.json` als Environment.
3. Wähle das Environment oben rechts aus.

> **Wichtig**: Die Collection setzt automatisch den `Authorization: Bearer {{bearer_token}}` Header für alle Requests. Du musst nur die Variable `bearer_token` im Environment füllen. Zusätzlich laufen nach jedem Request automatische Tests (Response-Zeit, JSON-Validierung, Success-Feld).

## Schritt 3: Environment anpassen

| Variable | Beschreibung | Typ | Standardwert |
|----------|--------------|-----|--------------|
| `baseUrl` | Aktive API-URL | default | `http://localhost:3000/api` |
| `bearer_token` | Clerk JWT ohne `Bearer` Prefix | 🔒 secret | _(leer)_ |
| `clerk_session_id` | Clerk Session-ID für erweiterte Tests | 🔒 secret | _(leer)_ |
| `test_user_id`, `test_course_id`, `test_booking_id` | IDs für Workflows | default | _(leer)_ |
| `stripe_webhook_secret` | Stripe Webhook Secret für lokale Tests | 🔒 secret | _(leer)_ |

Passe mindestens `baseUrl` und `bearer_token` an.

> ⚠️ **Sicherheitshinweis**: Variablen mit Typ `secret` werden in Postman maskiert und nicht in Exports übernommen. **Committe niemals echte Tokens** in `hemera.env.json`. Verwende stattdessen lokale Postman-Environments oder Environment-Variablen.

## Schritt 4: Clerk JWT besorgen

**Variante A (Browser Network Tab, Prod):**

1. Melde dich auf https://hemera.app an.
2. Öffne DevTools → Network.
3. Suche einen `/api` Request und kopiere den `Authorization` Header.
4. Trage nur den Token-Teil (nach `Bearer `) in `bearer_token` ein.

**Variante B (Clerk Dashboard, Dev/Test):**

1. Öffne das Clerk Dashboard → Users.
2. Wähle deinen Test-User → `Sessions` → `View Token`.
3. Kopiere das Token und speichere es in Postman unter `bearer_token`.

## Schritt 5: Erste Requests senden

1. **Öffentliche Route testen**: `Public → GET /health` → `Send`. Du solltest `success: true` zurückbekommen.
2. **Authentifizierte Route testen**: `Bookings → GET /bookings` → Environment muss `bearer_token` enthalten. Bei Erfolg siehst du deine Buchungen (oder eine leere Liste).

## Collection Features

Die Collection setzt folgende Automatisierungen:

- **Collection-Level Auth**: Jeder Request erhält automatisch `Authorization: Bearer {{bearer_token}}`
- **Pre-Request Script**: Liest `bearer_token` aus dem Environment und fügt den Header hinzu
- **Test Scripts** (laufen nach jedem Request):
  - Response-Zeit unter 2000ms
  - Valide JSON-Antwort
  - `success: true` für 2xx Responses
  - Error-Struktur (`success: false`, `error`) für 4xx/5xx

> Du musst keine manuellen Auth-Header setzen – fülle einfach `bearer_token` im Environment.

## Validierung / Scripts

| Befehl | Zweck |
|--------|-------|
| `npx spectral lint docs/api/openapi.yaml` | OpenAPI-Spezifikation validieren |
| `node scripts/validate-postman-import.mjs` | Postman Collection & Environment prüfen |
| `node scripts/enhance-postman-collection.mjs` | Auth + Scripts zur Collection hinzufügen |

## Troubleshooting

- **401 Unauthorized** → Token fehlt/abgelaufen? Environment ausgewählt? Dev-Server läuft?
- **404 Not Found** → `baseUrl` stimmt nicht oder Endpoint gehört nicht zur gewählten Umgebung.
- **CORS/Network Error** → Desktop-Version von Postman nutzen, falls lokale Requests blockiert werden.
- **Signature-Header nötig (Webhooks)** → In den jeweiligen Requests findest du Platzhalter. Fülle sie mit echten Signaturen, bevor du gegen Live-Services testest.

## Weiterführende Ressourcen

- Ausführliche Schritt-für-Schritt-Anleitung: [specs/019-OpenAPI-Postman/quickstart.md](../../specs/019-OpenAPI-Postman/quickstart.md)
- OpenAPI Referenz: [docs/api/openapi.yaml](openapi.yaml)
- Postman Collection: [docs/api/hemera.postman.json](hemera.postman.json)
- Environment Template: [docs/api/hemera.env.json](hemera.env.json)

Viel Erfolg beim Testen! Wenn du Fehler findest, bitte Issues im Repo anlegen oder direkt im PR kommentieren.
