# Feature Specification: User Dashboard

**Feature Branch**: `018-user-dashboard`  
**Created**: 2025-01-24  
**Status**: Draft  
**Input**: User description: "Enhance the dashboard with improved course cards, three-section layout (next seminar, upcoming bookings, completed courses), user course detail page, and Stripe invoice download integration."

## Clarifications

### Session 2025-01-24

- Q: Was definiert, dass ein Kurs als "absolviert" gilt? → A: Kurs-Enddatum liegt in der Vergangenheit UND Nutzer war Teilnehmer (nicht nur gebucht).
- Q: Was passiert mit gebuchten Kursen ohne Teilnahme (No-Show)? → A: Eigene Sektion "Seminare ohne Teilnahme", nur angezeigt wenn solche Kurse vorliegen.
- Q: Was enthalten "Ergebnisse" und "Nachbereitung" auf der Detailseite? → A: Ergebnisse = Video-Aufzeichnung + Materialien; Nachbereitung = Zusammenfassung.
- Q: Sortierreihenfolge innerhalb der Sektionen? → A: Chronologisch absteigend (neueste zuerst).
- Q: Wo soll der Rechnungs-Download verfügbar sein? → A: In allen Abschnitten, sobald die Rechnung verfügbar ist (alle bezahlten Buchungen).

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

Als eingeloggter Nutzer möchte ich auf meinem Dashboard einen klaren Überblick über meine gebuchten und absolvierten Kurse haben, sodass ich schnell auf relevante Kursinformationen, Vorbereitungsmaterialien und Rechnungen zugreifen kann.

### Acceptance Scenarios

#### A. Erweiterte Kurs-Karte

1. **Given** ein Nutzer mit einer bezahlten Kursbuchung, **When** er das Dashboard öffnet, **Then** sieht er auf der Kurs-Karte folgende Informationen:
   - Startdatum des Kurses
   - Enddatum (nur wenn der Kurs über mehrere Tage geht)
   - Startzeit und Endzeit
   - Veranstaltungsort mit Link zur Location-Seite

2. **Given** eine Kurs-Karte im Bereich "Nächstes Seminar", **When** der Nutzer die Karte betrachtet, **Then** sieht er drei Aktionsbuttons:
   - "Vorbereitung" – Link zur Vorbereitungs-Sektion der Kurs-Detailseite
   - "Ergebnisse" – Link zur Ergebnis-Sektion der Kurs-Detailseite
   - "Nachbereitung" – Link zur Nachbereitungs-Sektion der Kurs-Detailseite

#### B. Nutzer-Kurs-Detailseite

3. **Given** ein Nutzer klickt auf "Vorbereitung", **When** die Seite lädt, **Then** wird die Nutzer-Kurs-Detailseite mit der Vorbereitungs-Sektion angezeigt (bisherige `/my-courses` Funktionalität).

4. **Given** die Nutzer-Kurs-Detailseite, **When** der Nutzer navigiert, **Then** kann er zwischen den Sektionen "Vorbereitung", "Ergebnisse" und "Nachbereitung" wechseln.

5. **Given** die Sektion "Ergebnisse" auf der Detailseite, **When** der Nutzer diese öffnet, **Then** sieht er Video-Aufzeichnungen und bereitgestellte Kursmaterialien.

6. **Given** die Sektion "Nachbereitung" auf der Detailseite, **When** der Nutzer diese öffnet, **Then** sieht er eine Zusammenfassung des Kursinhalts.

#### C. Dashboard-Sektionen

7. **Given** ein Nutzer mit genau einer zukünftigen Buchung, **When** er das Dashboard öffnet, **Then** sieht er nur die Sektion "Nächstes Seminar" mit dieser Buchung.

6. **Given** ein Nutzer mit mehreren zukünftigen Buchungen, **When** er das Dashboard öffnet, **Then** sieht er:
   - "Nächstes Seminar": Die zeitlich nächste Buchung mit Aktionsbuttons
   - "Weitere gebuchte Seminare": Alle weiteren zukünftigen Buchungen ohne Aktionsbuttons

7. **Given** ein Nutzer mit absolvierten Kursen, **When** er das Dashboard öffnet, **Then** sieht er die Sektion "Absolvierte Seminare" mit diesen Kursen (ohne Aktionsbuttons, aber mit Rechnungs-Download).

8. **Given** ein Nutzer ohne zusätzliche Buchungen, **When** er das Dashboard öffnet, **Then** wird die Sektion "Weitere gebuchte Seminare" nicht angezeigt.

9. **Given** ein Nutzer mit gebuchten Kursen, deren Enddatum vergangen ist aber ohne Teilnahme (No-Show), **When** er das Dashboard öffnet, **Then** sieht er die Sektion "Seminare ohne Teilnahme" mit diesen Kursen.

10. **Given** ein Nutzer ohne No-Show-Kurse, **When** er das Dashboard öffnet, **Then** wird die Sektion "Seminare ohne Teilnahme" nicht angezeigt.

#### D. Stripe-Rechnungs-Download

11. **Given** eine bezahlte Buchung in einer beliebigen Dashboard-Sektion, **When** die Rechnung verfügbar ist und der Nutzer auf "Rechnung herunterladen" klickt, **Then** wird die Stripe-Rechnung als PDF heruntergeladen.

12. **Given** eine Buchung ohne verfügbare Rechnung, **When** der Nutzer die Kurs-Karte betrachtet, **Then** ist der Rechnungs-Download-Button nicht sichtbar oder deaktiviert.

### Edge Cases

- Was passiert, wenn ein Kurs keinen Veranstaltungsort hat? → Adresse wird nicht angezeigt, kein Link.
- Was passiert bei eintägigen Kursen? → Nur Startdatum wird angezeigt, kein Enddatum.
- Was wenn ein Nutzer keine Buchungen hat? → Leerzustand mit Aufforderung, Kurse zu entdecken.
- Was wenn die Stripe-Rechnung noch nicht verfügbar ist? → Button deaktiviert mit Hinweis "Rechnung wird erstellt".
- Kann ein Nutzer auf Vorbereitung zugreifen, bevor der Kurs beginnt? → Ja, Vorbereitung ist vor Kursbeginn zugänglich.
- Was passiert mit stornierten Buchungen? → Diese werden nicht auf dem Dashboard angezeigt.

---

## Requirements _(mandatory)_

### Functional Requirements

#### Kurs-Karte

- **FR-001**: System MUSS auf jeder Kurs-Karte das Startdatum anzeigen.
- **FR-002**: System MUSS das Enddatum anzeigen, wenn der Kurs über mehrere Tage geht.
- **FR-003**: System MUSS Start- und Endzeit des Kurses anzeigen.
- **FR-004**: System MUSS den Veranstaltungsort mit einem Link zur Location-Detailseite anzeigen.
- **FR-005**: System MUSS für Karten im Bereich "Nächstes Seminar" drei Aktionsbuttons bereitstellen: "Vorbereitung", "Ergebnisse", "Nachbereitung".

#### Dashboard-Sektionen

- **FR-006**: System MUSS die Sektion "Nächstes Seminar" anzeigen mit dem zeitlich nächsten gebuchten Kurs.
- **FR-007**: System MUSS die Sektion "Weitere gebuchte Seminare" nur anzeigen, wenn mehr als eine zukünftige Buchung existiert.
- **FR-008**: System MUSS die Sektion "Absolvierte Seminare" anzeigen für alle Kurse, deren Enddatum in der Vergangenheit liegt UND bei denen der Nutzer als Teilnehmer registriert ist (Participation existiert).
- **FR-009**: System MUSS die Sektion "Seminare ohne Teilnahme" anzeigen für alle Kurse, deren Enddatum in der Vergangenheit liegt UND bei denen keine Participation existiert (No-Show).
- **FR-010**: System MUSS die Sektion "Seminare ohne Teilnahme" nur anzeigen, wenn mindestens ein No-Show-Kurs existiert.
- **FR-011**: System MUSS Karten in "Weitere gebuchte Seminare", "Absolvierte Seminare" und "Seminare ohne Teilnahme" ohne Aktionsbuttons anzeigen.
- **FR-012**: System MUSS die Sektionen in der Reihenfolge "Nächstes Seminar" → "Weitere gebuchte Seminare" → "Absolvierte Seminare" → "Seminare ohne Teilnahme" von oben nach unten anordnen.
- **FR-012a**: System MUSS Kurse innerhalb jeder Sektion chronologisch absteigend sortieren (neueste zuerst).

#### Nutzer-Kurs-Detailseite

- **FR-013**: System MUSS eine dedizierte Nutzer-Kurs-Detailseite pro Buchung bereitstellen.
- **FR-014**: System MUSS die bisherige "Vorbereitung"-Funktionalität in die neue Detailseite integrieren.
- **FR-015**: System MUSS auf der Detailseite Sektionen für "Vorbereitung", "Ergebnisse" und "Nachbereitung" bereitstellen.
- **FR-015a**: Sektion "Ergebnisse" MUSS Video-Aufzeichnungen und bereitgestellte Kursmaterialien anzeigen.
- **FR-015b**: Sektion "Nachbereitung" MUSS eine Zusammenfassung des Kursinhalts anzeigen.
- **FR-016**: System MUSS direktes Navigieren zu einer spezifischen Sektion über URL-Anker ermöglichen.

#### Stripe-Rechnungs-Integration

- **FR-017**: System MUSS für alle bezahlten Buchungen einen Rechnungs-Download-Button anzeigen, sobald die Rechnung verfügbar ist (in allen Dashboard-Sektionen).
- **FR-018**: System MUSS die Stripe-Rechnung als PDF zum Download bereitstellen.
- **FR-019**: System MUSS Invoice-Daten (ID, URL) bei Zahlungsabschluss speichern.
- **FR-020**: System MUSS nur dem Buchungsinhaber Zugriff auf seine Rechnung gewähren.

### Non-Functional Requirements

- **NFR-001**: Dashboard MUSS innerhalb von 2 Sekunden vollständig geladen sein (LCP < 2.5s).
- **NFR-002**: Rechnungs-Download MUSS innerhalb von 3 Sekunden starten.
- **NFR-003**: Dashboard-Layout MUSS responsiv sein und auf mobilen Geräten gut funktionieren.
- **NFR-004**: Sektionen SOLLEN bei leerem Inhalt nicht angezeigt werden (keine leeren Container).

### Key Entities _(include if feature involves data)_

- **Booking**: Erweitert um Stripe-Invoice-Felder (Invoice-ID, Invoice-URL, Invoice-PDF-URL)
- **Course**: Enthält Location-Referenz für Adressanzeige
- **CourseParticipation**: Bestehende Entität für Vorbereitung/Ergebnisse/Nachbereitung

---

## Dependencies

- Bestehendes Booking-System und Buchungs-API
- Stripe-Integration für Zahlungen und Rechnungen (siehe `stripe-invoice-download-feature.md`)
- Course-Location-System für Adressverlinkung
- CourseParticipation-System für Vorbereitungs-Workflow
- Clerk-Authentifizierung für Nutzerzugriff

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
