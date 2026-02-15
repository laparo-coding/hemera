# Hemera Service API Documentation

## Übersicht

Die Hemera Service API ermöglicht autorisierten Service-Clients (wie Aither) den Zugriff auf Kurs- und Teilnehmerdaten sowie das Schreiben von Ergebnissen.

## Authentifizierung

### Clerk JWT-basierte Authentifizierung

Alle Service-API-Endpunkte erfordern einen gültigen Clerk Session Token im `Authorization` Header:

```
Authorization: Bearer <clerk-session-jwt>
```

### Erforderliche Rolle

Der authentifizierte User muss eine der folgenden Rollen haben:
- `api-client` - Dedizierte Service-User-Rolle
- `admin` - Voller Admin-Zugriff

Die Rolle wird in Clerk `publicMetadata` gespeichert:

```json
{
  "role": "api-client"
}
```

Wichtig: Service-to-Service JWTs müssen eine eingeschränkte Audience/Scope haben (z.B. `aud: ["aither-service"]`) und die `api-client` Rolle in den Token-Claims (`public_metadata.role` oder `role`) enthalten. Der clientseitige `HemeraClient` erzwingt diese Einschränkungen und erlaubt nur Requests gegen `/api/service/*` Endpunkte. Stelle sicher, dass der ausgestellte Clerk-Token die korrekten Claims und Audience enthält.

### Berechtigungen

The `api-client` role has the following permissions (defined in [`lib/auth/permissions.ts`](../../lib/auth/permissions.ts)):

- `read:courses` - Kurse lesen
- `read:participations` - Teilnahmen lesen
- `write:participation-results` - Ergebnisse schreiben

## Endpunkte

### GET /api/service/courses

Listet alle Kurse mit Teilnehmerzahlen auf.

**Query Parameters:**

| Parameter | Typ | Beschreibung | Default |
|-----------|-----|--------------|---------|
| `level` | `CourseLevel` | Filter nach Kurslevel (BASIC, INTERMEDIATE, ADVANCED) | - |
| `published` | `boolean` | Filter nach Veröffentlichungsstatus | `true` |
| `limit` | `number` | Maximale Anzahl Ergebnisse (1-500) | `100` |
| `offset` | `number` | Offset für Pagination | `0` |

**Example request:**

```bash
# Replace with your environment's base URL, e.g. $HEMERA_BASE_URL
curl -X GET "https://[YOUR_HEMERA_DOMAIN]/api/service/courses?level=BASIC&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Beispiel-Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx123...",
      "title": "Laparoskopie Basiskurs",
      "slug": "laparoskopie-basiskurs",
      "level": "BASIC",
      "startDate": "2026-03-15T00:00:00.000Z",
      "endDate": "2026-03-16T00:00:00.000Z",
      "participantCount": 12
    }
  ],
  "requestId": "req_abc123",
  "userId": "user_2abc...",
  "userRole": "api-client"
}
```

**Fehler-Responses:**

- `401 Unauthorized` - Kein gültiges Token
- `403 Forbidden` - Unzureichende Berechtigungen
- `429 Too Many Requests` - Rate Limit überschritten
- `500 Internal Server Error` - Server-Fehler

---

### GET /api/service/courses/[id]

Ruft Details eines einzelnen Kurses mit allen Participations ab.

**Path Parameters:**

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `id` | `string` | Kurs-ID |

**Example request:**

```bash
curl -X GET "https://[YOUR_HEMERA_DOMAIN]/api/service/courses/clx123..." \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Beispiel-Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "clx123...",
    "title": "Laparoskopie Basiskurs",
    "slug": "laparoskopie-basiskurs",
    "level": "BASIC",
    "startDate": "2026-03-15T00:00:00.000Z",
    "endDate": "2026-03-16T00:00:00.000Z",
    "participations": [
      {
        "id": "clp456...",
        "userId": "user_789...",
        "status": "ACTIVE",
        "createdAt": "2026-02-01T10:00:00.000Z"
      }
    ]
  },
  "requestId": "req_abc123",
  "userId": "user_2abc...",
  "userRole": "api-client"
}
```

**Fehler-Responses:**

- `401 Unauthorized` - Kein gültiges Token
- `403 Forbidden` - Unzureichende Berechtigungen
- `404 Not Found` - Kurs nicht gefunden
- `429 Too Many Requests` - Rate Limit überschritten
- `500 Internal Server Error` - Server-Fehler

---

### GET /api/service/participations/[id]

Ruft Details einer Participation ab.

**Path Parameters:**

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `id` | `string` | Participation-ID |

**Beispiel-Request:**

```bash
curl -X GET "https://[YOUR_HEMERA_DOMAIN]/api/service/participations/clp456..." \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Beispiel-Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "clp456...",
    "userId": "user_789...",
    "courseId": "clx123...",
    "status": "ACTIVE",
    "preparationIntent": "Ich möchte meine laparoskopischen Fähigkeiten verbessern",
    "desiredResults": "Sicherer Umgang mit laparoskopischen Instrumenten",
    "resultOutcome": null,
    "resultNotes": null,
    "resultCompletedAt": null,
    "createdAt": "2026-02-01T10:00:00.000Z",
    "updatedAt": "2026-02-01T10:00:00.000Z"
  },
  "requestId": "req_abc123",
  "userId": "user_2abc...",
  "userRole": "api-client"
}
```

**Fehler-Responses:**

- `401 Unauthorized` - Kein gültiges Token
- `403 Forbidden` - Unzureichende Berechtigungen
- `404 Not Found` - Participation nicht gefunden
- `429 Too Many Requests` - Rate Limit überschritten
- `500 Internal Server Error` - Server-Fehler

---

### PUT /api/service/participations/[id]/result

Aktualisiert die Ergebnis-Daten einer Participation.

**Path Parameters:**

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `id` | `string` | Participation-ID |

**Request Body:**

```typescript
{
  resultOutcome?: string;    // Max 2000 Zeichen
  resultNotes?: string;      // Max 2000 Zeichen
  complete?: boolean;        // Setzt Status auf COMPLETE
}
```

**Beispiel-Request:**

```bash
curl -X PUT "https://[YOUR_HEMERA_DOMAIN]/api/service/participations/clp456.../result" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resultOutcome": "Erfolgreich abgeschlossen",
    "resultNotes": "Sehr gute Leistung, alle Lernziele erreicht",
    "complete": true
  }'
```

**Beispiel-Response (200 OK):**

```json
{
  "success": true,
  "message": "Participation result updated successfully",
  "requestId": "req_abc123",
  "userId": "user_2abc...",
  "userRole": "api-client"
}
```

**Fehler-Responses:**

- `400 Bad Request` - Ungültiger Request Body
- `401 Unauthorized` - Kein gültiges Token
- `403 Forbidden` - Unzureichende Berechtigungen
- `404 Not Found` - Participation nicht gefunden
- `429 Too Many Requests` - Rate Limit überschritten
- `500 Internal Server Error` - Server-Fehler

---

## Rate Limiting

Die Service API implementiert Rate Limiting pro User/Role:

- **api-client**: 100 Requests pro Minute
- **admin**: 200 Requests pro Minute

Bei Überschreitung wird `429 Too Many Requests` zurückgegeben mit `Retry-After` Header.

## CORS

Die Service API unterstützt CORS für autorisierte Origins. Preflight-Requests (OPTIONS) werden automatisch behandelt.

## Monitoring & Logging

Alle Service-API-Aufrufe werden geloggt und in Rollbar überwacht:

- Request ID (für Tracing)
- User ID und Rolle
- Endpoint und Methode
- Status Code
- Response Time

Logs sind verfügbar in:
- Rollbar Dashboard (Fehler und Warnungen)
- Vercel Logs (alle Requests)
- Hemera Datenbank (Audit Trail)

## Fehlerbehandlung

Alle Fehler-Responses folgen diesem Schema:

```typescript
{
  success: false;
  error: string;           // Fehler-Typ
  code: string;            // Error Code (z.B. "UNAUTHORIZED")
  requestId: string;       // Request ID für Debugging
  userId?: string;         // User ID (falls authentifiziert)
  userRole?: string;       // User Rolle (falls authentifiziert)
}
```

### Error Codes

| Code | HTTP Status | Beschreibung |
|------|-------------|--------------|
| `UNAUTHORIZED` | 401 | Kein gültiges Token |
| `FORBIDDEN` | 403 | Unzureichende Berechtigungen |
| `NOT_FOUND` | 404 | Ressource nicht gefunden |
| `VALIDATION_ERROR` | 400 | Ungültige Request-Daten |
| `INVALID_INPUT` | 400 | Ungültiger Request Body |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate Limit überschritten |
| `INTERNAL_ERROR` | 500 | Server-Fehler |

## Implementierungsdetails

### Dateien

- **Endpunkte**: [`app/api/service/`](../../app/api/service/)
  - [`courses/route.ts`](../../app/api/service/courses/route.ts)
  - [`courses/[id]/route.ts`](../../app/api/service/courses/[id]/route.ts)
  - [`participations/[id]/route.ts`](../../app/api/service/participations/[id]/route.ts)
  - [`participations/[id]/result/route.ts`](../../app/api/service/participations/[id]/result/route.ts)

- **Auth**: [`lib/auth/permissions.ts`](../../lib/auth/permissions.ts)
- **Rate Limiting**: [`lib/middleware/rate-limit.ts`](../../lib/middleware/rate-limit.ts)
- **Logging**: [`lib/monitoring/service-api-logger.ts`](../../lib/monitoring/service-api-logger.ts)
- **Response Helpers**: [`lib/utils/service-api-response.ts`](../../lib/utils/service-api-response.ts)

### Tests

Contract-Tests für die Service API befinden sich in:
- `tests/contracts/service-api.contract.spec.ts`

## Beispiel-Integration (Aither)

See the [Aither Service User Integration plan](../../plans/aither-hemera-api-integration.md) for integration guidance.

### Client Implementation

```typescript
import { HemeraClient } from '@/lib/hemera/client';
import { getTokenManager } from '@/lib/hemera/token-manager';

const tokenManager = getTokenManager();
const client = new HemeraClient({
  baseUrl: process.env.HEMERA_BASE_URL || 'https://[YOUR_HEMERA_DOMAIN]',
  getToken: () => tokenManager.getToken(),
});

// Kurse abrufen
const courses = await client.get('/api/service/courses', CoursesSchema);

// Ergebnis schreiben
await client.put(
  `/api/service/participations/${id}/result`,
  { resultOutcome: '...', complete: true }
);
```

## Support

Bei Fragen oder Problemen:
- Rollbar Dashboard prüfen
- Hemera-Team kontaktieren
- [GitHub Issues](https://github.com/hemera-academy/hemera/issues)
