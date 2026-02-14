# `reportError` — `additionalData` keys

Kurzübersicht der `additionalData`-Schlüssel, die beim Aufruf von `reportError(...)` im Codebase verwendet werden. Ziel: Konsistente Telemetrie und PII-Redaktion.

Hinweis: Diese Liste wurde automatisch aus den wichtigsten `reportError`-Aufrufen zusammengestellt (Produktionstest- und Dev-Mocks ausgeschlossen). Falls Du möchtest, kann ich die Liste rekursiv erweitern oder eine Policy-Datei (Whitelist/Blacklist) erzeugen.

- **lib/auth/permissions.ts**
  - `userId` — betroffene Clerk/User-ID
  - `operation` — Operation/Handler-Label (z. B. `getUserRole`)
  - `errorType` — normalisierter Fehler-Typ (z. B. `clerk_api_error`)
  - `originalError` — bereits redigiert: `"[redacted]"`

- **lib/middleware/rate-limit.ts**
  - `context: 'rateLimit:upstash'`

- **lib/monitoring/service-api-logger.ts**
  - `context: 'serviceApiLogger.persist'`

- **lib/logging/audit.ts**
  - `context: 'persistServiceApiLog'`

- **lib/services/prerequisite.ts**
  - `context` — z. B. `PrerequisiteService.isUserOutperformer` oder `PrerequisiteService.checkPrerequisite`
  - `clerkUserId` — Clerk user id (keine E-Mail)
  - `targetLevel` — bei Prüfung der Zielstufe
  - `errorType` — normalisierter Fehler-Typ

- **lib/services/loops.ts**
  - `context` — z. B. `LoopsService.getAdminEmails`, `LoopsService.sendPrerequisiteReviewEmail`, `LoopsService.sendBookingRejectedEmail`
  - `bookingId` — bei E-Mail-Workflows
  - `recipientCount` — Anzahl Empfänger (bei Batch-Send)
  - `errorType` — normalisierter Fehler-Typ
  - `recipientEmail` — maskiert / gehasht (z. B. `j***e@example.com`)

- **lib/db/admin/courses.ts**
  - `issueCount` — Anzahl Zod-Validation-Issues
  - `issues` — strukturierte Liste (path/code/message)
  - `receivedDataSummary` — kompakte Struktur-Meta (type/keyCount)

- **app/api/stripe/webhook/route.ts**
  - `sessionId`, `courseId`, `userId` — checkout.session.completed metadata
  - `bookingId`, `paymentIntentId`, `error` — payment_intent.payment_failed (Fehler-Message kann sensibel sein; bereits vor Verwendung sanitisiert)
  - `disputeId`, `amount`, `reason`, `chargeId` — charge.dispute.created

- **app/api/upload/location-image/route.ts**
  - `operation: 'location-image-upload'`

- **app/api/upload/thumbnail/route.ts**
  - `operation: 'thumbnail-upload'`

- **lib/middleware/api-error-handling.ts**
  - `duration` — gemessene Zeit (ms) bei langsamen Antworten
  - `performanceIssue`, `slowApiCall` — Flags

- **app/api/bookings/route.ts**
  - `additionalData` verwendet `sanitizeForErrorReporting(...)` (kompakte/gesäuberte Struktur; vermeidet PII)


Nächste Schritte (optional):
- Erweitern: alle `reportError`-Aufrufe durchsuchen und jede `additionalData`-Form dokumentieren.
- Policy: `docs/monitoring/reporting-policy.md` erstellen mit erlaubter Schlüssel-Whitelist und Redaction-Regeln (rekursiv vs. top-level).
- Automatisierung: ESLint-Rule / Biome-Check, die `additionalData`-Schlüssel gegen die Whitelist prüft.

Wenn Du möchtest, erstelle ich die Policy-Datei und füge automatisierte Prüfungen hinzu.