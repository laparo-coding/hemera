# Quickstart: Hemera API in Postman importieren

Diese Anleitung zeigt dir, wie du die Hemera API-Spezifikation in Postman importierst und deinen ersten API-Request ausführst.

## Voraussetzungen

- [Postman](https://www.postman.com/downloads/) (Desktop-App oder Web-Version)
- Zugang zur Hemera-Anwendung (für Auth-Tokens)
- Clerk-Account (für authentifizierte Endpoints)

## Schnellstart

### 1. OpenAPI-Spezifikation importieren

1. Öffne Postman und gehe zu **File → Import** (oder klicke auf "Import")
2. Wähle **Upload Files** und lade `docs/api/openapi.yaml` hoch
3. Bestätige den Import mit **Import**

Postman erstellt automatisch eine Collection mit allen Endpoints, gruppiert nach Tags.

### 2. Environment einrichten

1. Importiere `docs/api/hemera.env.json` (gleicher Import-Prozess)
2. Oder erstelle ein neues Environment mit folgenden Variablen:

| Variable | Wert (Development) | Wert (Production) |
|----------|-------------------|-------------------|
| `baseUrl` | `http://localhost:3000/api` | `https://hemera.app/api` |
| `clerkToken` | `<dein-JWT-Token>` | `<dein-JWT-Token>` |

3. Wähle das Environment in der oberen rechten Ecke aus

### 3. Clerk JWT Token erhalten

Für authentifizierte Endpoints benötigst du ein Clerk JWT Token:

#### Option A: Aus Browser DevTools

1. Öffne https://hemera.app und melde dich an
2. Öffne DevTools (F12) → Network Tab
3. Führe eine beliebige Aktion aus (z.B. "Meine Kurse" öffnen)
4. Finde einen API-Request und kopiere den `Authorization` Header
5. Das Token ist der Teil nach "Bearer "

#### Option B: Clerk Dashboard (Development)

1. Öffne dein Clerk Dashboard → Users
2. Wähle deinen Test-User
3. Klicke auf "Sessions" → "View Token"
4. Kopiere das JWT Token

#### Token in Postman eintragen

1. Gehe zu deinem Environment
2. Setze `clerkToken` auf das kopierte Token (ohne "Bearer ")
3. Speichere das Environment

### 4. Erster API-Request

**Teste einen öffentlichen Endpoint:**

1. Öffne die importierte Collection
2. Wähle **Public → GET /health**
3. Klicke auf **Send**

Erwartete Antwort:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-04T10:00:00.000Z"
  }
}
```

**Teste einen authentifizierten Endpoint:**

1. Wähle **Bookings → GET /bookings**
2. Stelle sicher, dass dein Environment ausgewählt ist
3. Klicke auf **Send**

Bei erfolgreicher Authentifizierung siehst du deine Buchungen.

## Troubleshooting

### "401 Unauthorized"

- Prüfe, ob das Environment ausgewählt ist
- Prüfe, ob `clerkToken` gesetzt ist
- JWT Tokens laufen ab - hole dir ein neues Token

### "404 Not Found"

- Prüfe die `baseUrl` Variable
- Stelle sicher, dass der Server läuft (Development)

### "CORS Error" (Web-Version)

- Nutze die Postman Desktop-App für lokale Entwicklung
- Oder starte den Dev-Server mit CORS-Header für Postman

## Environment-Variablen

Die vollständige Liste der Environment-Variablen:

```json
{
  "baseUrl": "http://localhost:3000/api",
  "clerkToken": "",
  "courseId": "",
  "bookingId": "",
  "locationId": "",
  "userId": ""
}
```

## Nächste Schritte

- Erkunde die Endpoints nach Tags gruppiert
- Nutze die eingebauten Beispiele in jeder Request
- Erstelle eigene Test-Collections für spezifische Workflows
- Schau dir die Dokumentation im "Documentation" Tab an

## Hilfreiche Links

- [Postman Learning Center](https://learning.postman.com/)
- [OpenAPI in Postman importieren](https://learning.postman.com/docs/integrations/available-integrations/working-with-openAPI/)
- [Hemera API Dokumentation](../api/README.md)
