# Course Assignments – Geführter Kursteilnahme-Workflow

> **Status**: Implementiert (Spec 016)  
> **Letzte Aktualisierung**: 2025-01-13

## Überblick

Das Course Assignments Feature bietet Kursteilnehmern einen geführten 4-stufigen Workflow für die
Vor- und Nachbereitung ihrer Gehaltsverhandlungskurse:

1. **Vorbereitung** – Ziele definieren, Wunschergebnisse festlegen, Vorgesetzten-Profil erfassen
2. **Zusammenfassung** – Mux Video-Assets ansehen (optional, abhängig von Kursinhalt)
3. **Nachbereitung** – Gesprächsplan entwickeln, Termin für Gehaltsgespräch planen
4. **Ergebnisse** – Verhandlungsergebnisse dokumentieren und reflektieren

## Architektur

### Datenmodell

```
┌────────────────────────┐      1:1       ┌─────────────────────────┐
│       Booking          │───────────────▶│   CourseParticipation   │
│  (bestehende Buchung)  │                │   (Fortschritt-Tracker) │
└────────────────────────┘                └─────────────────────────┘
                                                     │
                                          ┌──────────┴──────────┐
                                          │                     │
                                    1:N   ▼               1:N   ▼
                          ┌──────────────────────┐  ┌─────────────────────────────┐
                          │ ParticipationDocument│  │ ParticipationSummaryOverride│
                          │    (Lebenslauf PDF)  │  │  (Booking-spezifische Assets)│
                          └──────────────────────┘  └─────────────────────────────┘
```

### API Endpunkte

| Endpunkt | Methoden | Beschreibung |
|----------|----------|--------------|
| `/api/my-courses/[bookingId]/preparation` | GET, PUT | Vorbereitungsdaten lesen/speichern |
| `/api/my-courses/[bookingId]/resume` | GET, POST, DELETE | Lebenslauf-Management (Single-Active) |
| `/api/my-courses/[bookingId]/summary` | GET, PUT | Video-Assets und View-Tracking |
| `/api/my-courses/[bookingId]/debriefing` | GET, PUT | Nachbereitungsplan speichern |
| `/api/my-courses/[bookingId]/result` | GET, PUT | Verhandlungsergebnisse erfassen |

### UI Komponenten

| Komponente | Pfad | Beschreibung |
|------------|------|--------------|
| `CourseParticipationStepper` | `components/participation/` | MUI Vertical Stepper mit 4 Schritten |
| `SummaryAssetList` | `components/participation/` | Mux Video Player mit View-Tracking |
| `ResumeUploader` | `components/participation/` | Drag-and-Drop PDF Upload |
| `MyCoursesClient` | `app/my-courses/` | Dashboard mit Accordion-Navigation |

## Status-Workflow

```
PREPARATION → SUMMARY → DEBRIEFING → RESULT → COMPLETE
      │            │
      │            └──(übersprungen wenn keine Assets)
      │
      └──(Lebenslauf-Upload optional)
```

### Status-Enum

```typescript
enum ParticipationStatus {
  PREPARATION = 'PREPARATION',
  SUMMARY = 'SUMMARY',
  DEBRIEFING = 'DEBRIEFING',
  RESULT = 'RESULT',
  COMPLETE = 'COMPLETE',
}
```

## Setup & Konfiguration

### 1. Umgebungsvariablen

```bash
# .env.local
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### 2. Datenbank-Migration

```bash
# Migration anwenden
npx prisma migrate dev --name 016-course-participation

# Client regenerieren
npm run prisma:generate
```

### 3. Testdaten seeden

```bash
# E2E Seed mit Buchungen und Assets
npm run seed:e2e

# Oder manuell Summary-Assets hinzufügen
npx tsx scripts/seed-summary-assets.ts
```

## Runbooks

### Lebenslauf-Upload Probleme

**Symptom**: Benutzer sieht "Upload fehlgeschlagen" Fehlermeldung

**Diagnose**:
1. Prüfen ob `BLOB_READ_WRITE_TOKEN` korrekt gesetzt ist
2. Rollbar Logs filtern nach `participation.resume_upload_failed`
3. Dateigröße prüfen (Limit: 5MB)
4. Dateityp prüfen (nur PDF erlaubt)

**Lösung**:
- Bei Token-Problemen: Vercel Dashboard → Storage → Blob → Token regenerieren
- Bei Größenproblemen: Benutzer informieren über 5MB Limit

### Video-Assets werden nicht angezeigt

**Symptom**: Zusammenfassungs-Schritt ist leer oder ausgeblendet

**Diagnose**:
1. Prüfen ob `CourseSummaryAsset` Einträge für den Kurs existieren
2. Prüfen ob `ParticipationSummaryOverride` für Booking existiert
3. Mux Playback ID Validität prüfen

```sql
-- Kurs-Assets prüfen
SELECT * FROM course_summary_assets WHERE course_id = '<courseId>';

-- Override-Assets prüfen
SELECT * FROM participation_summary_overrides WHERE participation_id = '<participationId>';
```

**Lösung**:
- Assets über Admin-UI oder direkt in DB hinzufügen
- Mux Dashboard prüfen ob Asset "ready" Status hat

### Status-Synchronisation

**Symptom**: Benutzer kann Schritt nicht abschließen

**Diagnose**:
1. Aktuellen Status in `course_participations` prüfen
2. Pflichtfelder für aktuellen Schritt prüfen

```sql
SELECT id, status, preparation_completed_at, summary_completed_at
FROM course_participations
WHERE booking_id = '<bookingId>';
```

**Lösung**:
- Status manuell korrigieren falls inkonsistent
- Fehlende Pflichtfelder identifizieren und Benutzer informieren

## Monitoring & Observability

### Rollbar Events

| Event Type | Beschreibung |
|------------|--------------|
| `participation.step_started` | Benutzer beginnt neuen Schritt |
| `participation.step_completed` | Schritt erfolgreich abgeschlossen |
| `participation.resume_uploaded` | Lebenslauf hochgeladen |
| `participation.resume_deleted` | Lebenslauf gelöscht |
| `participation.summary_viewed` | Video-Asset angesehen |
| `participation.flow_completed` | Gesamter Workflow abgeschlossen |

### Fehler-Events

| Event Type | Beschreibung |
|------------|--------------|
| `participation.authorization_failed` | Unberechtigter Zugriff |
| `participation.resume_upload_failed` | Upload-Fehler |
| `participation.validation_failed` | Validierungsfehler |
| `participation.database_error` | DB-Operationsfehler |

### Dashboard-Abfrage (Rollbar)

```
context.participationId exists AND 
context.event_type LIKE "participation.%"
```

## Manuelle Verifikation

### Smoke Test Checkliste

1. [ ] Als Teilnehmer einloggen
2. [ ] `/my-courses` aufrufen
3. [ ] Kurs mit bestätigter Buchung auswählen
4. [ ] Vorbereitung ausfüllen und speichern
5. [ ] Lebenslauf hochladen (PDF, <5MB)
6. [ ] Lebenslauf löschen und neuen hochladen
7. [ ] Vorbereitung abschließen
8. [ ] Zusammenfassung ansehen (falls Assets vorhanden)
9. [ ] Nachbereitung ausfüllen
10. [ ] Ergebnisse eintragen
11. [ ] Workflow abschließen
12. [ ] Seite neu laden – alle Daten persistiert

### E2E Test Ausführung

```bash
# Participation Flow Tests
npx playwright test --grep "course participation"

# Vollständiger Test-Run
npm test
```

## API Validierung

### Preparation Schema

```typescript
{
  preparationIntent: string (optional),
  desiredResults: string (optional),
  lineManagerProfile: string (optional),
}
```

### Debriefing Schema

```typescript
{
  debriefingPlan: string (optional),
  salaryDiscussionMonth: string (optional), // Format: YYYY-MM
}
```

### Result Schema

```typescript
{
  resultOutcome: string (optional),
  resultNotes: string (optional),
}
```

## Sicherheit

- Alle Endpunkte erfordern Clerk-Authentifizierung
- Benutzer können nur eigene Participations bearbeiten
- Lebenslauf-URLs sind mit Vercel Blob signiert
- Rollbar loggt alle Autorisierungsfehler

## Bekannte Einschränkungen

1. **Ein aktiver Lebenslauf pro Buchung** – Neuer Upload ersetzt vorherigen
2. **Keine Bulk-Operationen** – Jede Buchung einzeln bearbeiten
3. **Mux Assets müssen manuell angelegt werden** – Kein automatischer Import

## Weiterentwicklung

- [ ] Admin-UI für Summary Asset Management
- [ ] E-Mail Benachrichtigungen bei Workflow-Abschluss
- [ ] PDF-Export der Participation-Daten
- [ ] Bulk-Status-Updates für Admins
