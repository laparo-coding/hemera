# Hemera Service API Documentation

## Übersicht

Die Hemera Service API ermöglicht autorisierten Service-Clients (wie Aither) den Zugriff auf Kurs- und Teilnehmerdaten sowie das Schreiben von Ergebnissen.

## Authentifizierung

Die Service API unterstützt zwei Authentifizierungsmethoden — Clerk JWT für Browser-basierte Zugriffe und API-Key für M2M (Machine-to-Machine) Kommunikation.

### Methode 1: Clerk JWT-basierte Authentifizierung

Für Browser-basierte oder interaktive Zugriffe: gültigen Clerk Session Token im `Authorization` Header senden:

```
Authorization: Bearer <clerk-session-jwt>
```

### Methode 2: API-Key-basierte Authentifizierung (M2M)

Für Service-to-Service-Kommunikation (z.B. Aither → Hemera) kann statt eines Clerk JWTs ein statischer API-Key verwendet werden:

```
X-API-Key: <hemera-service-api-key>
```

**Konfiguration:**

| Umgebungsvariable | Beschreibung |
|-------------------|--------------|
| `HEMERA_SERVICE_API_KEY` | API-Key (mind. 32 Zeichen, nur druckbare ASCII-Zeichen) |
| `HEMERA_SERVICE_USER_ID` | Clerk User-ID des Service-Accounts (Format: `user_...`) |

> **Wichtig:** Beide Variablen müssen entweder beide gesetzt oder beide leer sein (Zod-Validierung erzwingt dies beim Start).
>
> **Startup-Verhalten bei Validierungsfehler:** Fehlen oder stimmen die Variablen nicht überein, bricht die Anwendung mit Exit-Code 1 ab. Der Fehler wird auf `stderr` protokolliert, z.B.:
> ```
> [env] Environment validation failed for fields: [ 'HEMERA_SERVICE_USER_ID' ]
> Error: Environment validation failed; aborting startup
> ```
> **Fehlerbehebung:** Prüfe, ob `HEMERA_SERVICE_API_KEY` (mind. 32 Zeichen) und `HEMERA_SERVICE_USER_ID` (Format `user_...`) in `.env.local` bzw. den Vercel-Umgebungsvariablen gesetzt sind. Beide Variablen müssen immer gemeinsam gesetzt oder entfernt werden.

**Key generieren:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**Sicherheitshinweise:**
- Der Key wird über SHA-256-Hashing timing-sicher verglichen (`crypto.timingSafeEqual`)
- API-Keys mit Leerzeichen oder Steuerzeichen werden abgelehnt
- Bei ungültigem Key-Format antwortet der Next.js-Middleware-Proxy bereits mit 401, **bevor** die Clerk-Authentifizierung stattfindet (kein Fallback auf Clerk-Validierung)

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

Die `api-client` Rolle hat folgende Berechtigungen (definiert in [`lib/auth/permissions.ts`](../../lib/auth/permissions.ts)):

- `read:courses` - Kurse lesen
- `read:participations` - Teilnahmen lesen
- `write:participation-results` - Ergebnisse schreiben

## Endpunkte

### GET /api/service/courses

Listet alle Kurse mit Teilnehmerzahlen auf.

**Query Parameters:**

| Parameter | Typ | Beschreibung | Default |
|-----------|-----|--------------|---------|
| `level` | `CourseLevel` | Filter nach Kurslevel (BEGINNER, INTERMEDIATE, ADVANCED) | - |
| `published` | `boolean` | Filter nach Veröffentlichungsstatus | `true` |
| `limit` | `number` | Maximale Anzahl Ergebnisse (1-500) | `100` |
| `offset` | `number` | Offset für Pagination | `0` |

**Beispiel-Request:**

```bash
# ⚠️ Ersetze <your-hemera-instance> durch deine tatsächliche Domain (z.B. localhost:3000 oder Staging-URL)
curl -X GET "https://<your-hemera-instance>/api/service/courses?level=BEGINNER&limit=10" \
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
      "level": "BEGINNER",
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

**Beispiel-Request:**

```bash
# ⚠️ Ersetze <your-hemera-instance> durch deine tatsächliche Domain (z.B. localhost:3000 oder Staging-URL)
curl -X GET "https://<your-hemera-instance>/api/service/courses/clx123..." \
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
    "level": "BEGINNER",
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
# ⚠️ Ersetze <your-hemera-instance> durch deine tatsächliche Domain (z.B. localhost:3000 oder Staging-URL)
curl -X GET "https://<your-hemera-instance>/api/service/participations/clp456..." \
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
# ⚠️ Ersetze <your-hemera-instance> durch deine tatsächliche Domain (z.B. localhost:3000 oder Staging-URL)
curl -X PUT "https://<your-hemera-instance>/api/service/participations/clp456.../result" \
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
- **admin**: 200 Requests pro Minute *(reduziert von 500 auf 200 für mehr Stabilität und gleichmäßige Lastverteilung, wirksam seit Februar 2026 — bei Bedarf bitte das Hemera-Team kontaktieren)*

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

Siehe [Aither Service User Setup Guide](https://github.com/Laparo/aither/blob/main/docs/SERVICE_USER_SETUP.md) für eine vollständige Integrationsanleitung.

### Client-Implementierung

```typescript
import { HemeraClient } from '@/lib/hemera/client';
import { getTokenManager } from '@/lib/hemera/token-manager';

const tokenManager = getTokenManager();
const client = new HemeraClient({
  // baseUrl aus Umgebungsvariable oder Platzhalter
  baseUrl: process.env.HEMERA_BASE_URL ?? 'https://<your-hemera-instance>',
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
