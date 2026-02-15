# Telemetry Reporting Policy

Zweck
- Schütze PII und sensible Fehlerdetails in Telemetrie.
- Vereinheitliche `additionalData`-Schlüssel in `reportError()`-Aufrufen.

Grundsätze
- Keine Klartext-Fehlertexte oder Roh-Antworten in `additionalData` (z. B. `originalError`, `error`, `message`) — diese müssen redigiert oder in sanitised Form übergeben werden.
- E-Mail-Adressen dürfen nur maskiert (`j***e@example.com`) werden.
- Keine vollständigen HTTP-Responses, Tokens oder API-Keys in `additionalData`.
- `userId` kann übergeben werden (soweit nötig), E-Mail niemals (außer maskiert) ohne Zustimmung.

Whitelist (erlaubte top-level keys)
- `context` (string)
- `requestId` (string)
- `sessionId` (string)
- `bookingId` (string)
- `courseId` (string)
- `userId` (string)
- `paymentIntentId` (string)
- `disputeId` (string)
- `amount` (number)
- `reason` (string)
- `recipientCount` (number)
- `errorType` (string)
- `issueCount` (number)
- `issues` (array of sanitized issue objects)
- `receivedDataSummary` (object with `type` and `keyCount`)
- `recipientEmail` (masked string)
- `operation` (string)
- `duration` (number)
- `performanceIssue` (boolean)
- `slowApiCall` (boolean)
- `timestamp` (string)

Redaction rules
- Keys matching `/originalError/i`, `/errorMessage/i`, `/message$/i` müssen vor Reporting redigiert ("[redacted]") werden.
- Bei Unsicherheit: lieber redigieren.

Automatisierung
- Ein einfaches Prüfskript `scripts/check-reporterror-keys.mjs` kann Repo-weit `additionalData`-Blöcke extrahieren und gegen die Whitelist prüfen.
- Langfristig: ESLint-Rule oder Biome-Check, der `reportError`-Aufrufe validiert.

Durchsetzung
- PRs, die `reportError`-Änderungen enthalten, sollten die Policy prüfen und ggf. redigieren.
- Die CI-Pipeline kann optional das Prüfskript ausführen und Warnungen (oder Errors) melden.

Kontakt
- Für Fragen zu dieser Policy wende dich an das Observability-Team oder den Autor der Änderung.
