# Hemera API Doku

> OpenAPI 3.1.0 Spezifikation & Postman Collection für alle 56 Endpoints

Diese Seite fasst die wichtigsten Schritte aus `specs/017-OpenAPI-Postman/quickstart.md` zusammen, damit du sofort loslegen kannst.

## Dateien

| Datei | Zweck |
|-------|-------|
| `openapi.yaml` | Vollständige OpenAPI 3.1.0 Spezifikation (Tags: Public, Auth, Bookings, Courses, Locations, Admin, Webhooks, Monitoring) |
| `hemera.postman.json` | Postman Collection v2.1 inkl. Ordnern nach Tags und globalen Pre-Request/Test-Skripten |
| `hemera.env.json` | Environment-Vorlage mit Basis-URLs, Clerk-Token und Platzhaltern für IDs |

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

> Hinweis: Die Collection enthält bereits ein Pre-Request-Skript, das automatisch den `Authorization`-Header setzt, wenn `clerkToken` im Environment hinterlegt ist. Außerdem laufen Basistests (Statuscode, Antwortzeit, Hemera-Wrapper) nach jedem Request.

## Schritt 3: Environment anpassen

| Variable | Beschreibung | Standardwert |
|----------|--------------|--------------|
| `baseUrl` | Aktive API-URL | `http://localhost:3000/api` |
| `baseUrlStaging` | Staging-URL (Referenz) | `https://staging.hemera.app/api` |
| `baseUrlProd` | Prod-URL (Referenz) | `https://hemera.app/api` |
| `clerkToken` | Clerk JWT ohne `Bearer ` | _(leer)_ |
| `courseId`, `bookingId`, `locationId`, `userId` | Platzhalter für Workflows | _(leer)_ |

Passe mindestens `baseUrl` und `clerkToken` an. Für Staging/Prod kannst du `baseUrl` temporär überschreiben.

## Schritt 4: Clerk JWT besorgen

**Variante A (Browser Network Tab, Prod):**

1. Melde dich auf https://hemera.app an.
2. Öffne DevTools → Network.
3. Suche einen `/api` Request und kopiere den `Authorization` Header.
4. Trage nur den Token-Teil nach `Bearer ` bei `clerkToken` ein.

**Variante B (Clerk Dashboard, Dev/Test):**

1. Öffne das Clerk Dashboard → Users.
2. Wähle deinen Test-User → `Sessions` → `View Token`.
3. Kopiere das Token und speichere es in Postman.

## Schritt 5: Erste Requests senden

1. **Öffentliche Route testen**: `Public → GET /health` → `Send`. Du solltest `success: true` zurückbekommen.
2. **Authentifizierte Route testen**: `Bookings → GET /bookings` → Environment muss `clerkToken` enthalten. Bei Erfolg siehst du deine Buchungen (oder eine leere Liste).

## Troubleshooting

- **401 Unauthorized** → Token fehlt/abgelaufen? Environment ausgewählt? Dev-Server läuft?
- **404 Not Found** → `baseUrl` stimmt nicht oder Endpoint gehört nicht zur gewählten Umgebung.
- **CORS/Network Error** → Desktop-Version von Postman nutzen, falls lokale Requests blockiert werden.
- **Signature-Header nötig (Webhooks)** → In den jeweiligen Requests findest du Platzhalter. Fülle sie mit echten Signaturen, bevor du gegen Live-Services testest.

## Validierung / Tests

| Schritt | Zweck |
|--------|-------|
| `npx spectral lint docs/api/openapi.yaml` | Stellt sicher, dass die Spezifikation valide ist (bereits ausgeführt, 0 Warnungen/Fehler). |
| Postman-Import laut Quickstart | Bestätigt, dass Collection + Environment sich ohne Fehler importieren lassen. |
| Manuelle Requests (`/health`, `/bookings`) | Verifizieren, dass Server & Auth funktionieren. Beschrieben in `specs/017-OpenAPI-Postman/quickstart.md`. |

## Weiterführende Ressourcen

- Ausführliche Schritt-für-Schritt-Anleitung: [specs/017-OpenAPI-Postman/quickstart.md](../../specs/017-OpenAPI-Postman/quickstart.md)
- OpenAPI Referenz: [docs/api/openapi.yaml](openapi.yaml)
- Postman Collection: [docs/api/hemera.postman.json](hemera.postman.json)
- Environment Template: [docs/api/hemera.env.json](hemera.env.json)

Viel Erfolg beim Testen! Wenn du Fehler findest, bitte Issues im Repo anlegen oder direkt im PR kommentieren.
