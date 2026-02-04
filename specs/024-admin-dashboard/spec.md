# Spec 024: Admin Dashboard

## Status: Draft

## Overview

Überarbeitung des Admin Dashboards mit einheitlichem Layout, verbesserter Navigation und deutscher Lokalisierung. Das Dashboard dient als zentrale Anlaufstelle für alle administrativen Funktionen der Hemera Academy.

## Goals

1. **Einheitliches Layout**: Standardbreite des Admin Dashboards für alle Unterseiten übernehmen
2. **Verbesserte Navigation**: Breadcrumb-Navigation auf allen Unterseiten
3. **Konsistentes Design**: Einheitlicher Kopfbereich (Head Space) auf allen Unterseiten
4. **Übersichtliche Struktur**: 3-Spalten-Grid für Dashboard-Karten
5. **Deutsche Lokalisierung**: Alle Texte in deutscher Sprache
6. **Integration bestehender Features**: Outperformer-Checkbox, Seminarmaterial-Verlinkung

## Non-Goals

- Neue Authentifizierungs-Flows
- Mobile-First Redesign (responsive bleibt bestehen)
- Änderungen an der Clerk-Integration selbst

## User Stories

### US-1: Admin navigiert zurück zum Dashboard
Als Admin möchte ich auf jeder Unterseite eine Breadcrumb-Navigation sehen, damit ich schnell zum Admin Dashboard zurückkehren kann.

### US-2: Admin hat konsistente Ansicht
Als Admin möchte ich, dass alle Unterseiten dieselbe Breite wie das Dashboard haben, damit das Layout einheitlich wirkt.

### US-3: Admin verwaltet Benutzer
Als Admin möchte ich Clerk-Benutzerdaten sehen und den Outperformer-Status setzen können.

### US-4: Admin verknüpft Seminarmaterial
Als Admin möchte ich bei jedem Curriculum-Item ein Seminarmaterial verlinken können.

### US-5: Admin überwacht Systemstatus
Als Admin möchte ich in "Berichte & Analysen" den API-Health-Status und Systemstatus sehen.

### US-6: Admin veröffentlicht Kurse per Toggle
Als Admin möchte ich den Veröffentlichungsstatus eines Kurses per Toggle ändern können, ohne eine separate Aktion auszuführen.

### US-7: Admin verwaltet Standorte einheitlich
Als Admin möchte ich, dass die Standortverwaltung das gleiche Layout wie die Kursverwaltung hat.

## Technical Requirements

### TR-1: Layout-Standardisierung

```typescript
// Konstante für Dashboard-Breite
const ADMIN_DASHBOARD_WIDTH = 'max-w-7xl' // oder entsprechender MUI-Wert

// Alle Admin-Seiten verwenden diese Breite
<Container maxWidth="lg" sx={{ maxWidth: '1280px' }}>
```

### TR-2: Breadcrumb-Komponente

```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
}

// Beispiel-Nutzung:
<AdminBreadcrumb items={[
  { label: 'Admin Dashboard', href: '/admin' },
  { label: 'Benutzerverwaltung' }
]} />
```

### TR-3: Head Space Konstante

```typescript
// Einheitlicher Kopfbereich für alle Admin-Unterseiten
const ADMIN_PAGE_HEAD_SPACE = {
  paddingTop: 4,    // 32px
  paddingBottom: 3, // 24px
  marginBottom: 4,  // 32px
}
```

### TR-4: Dashboard Grid-Struktur

```typescript
// 3-Spalten-Grid für Dashboard-Karten
<Grid container spacing={3}>
  {dashboardCards.map(card => (
    <Grid item xs={12} sm={6} md={4} key={card.id}>
      <DashboardCard {...card} />
    </Grid>
  ))}
</Grid>
```

### TR-5: Dashboard-Karten (6 Stück)

| Karte | Route | Icon |
|-------|-------|------|
| Benutzerverwaltung | `/admin/users` | People |
| Kursverwaltung | `/admin/courses` | School |
| Standortverwaltung | `/admin/locations` | LocationOn |
| Testimonial-Verwaltung | `/admin/testimonials` | FormatQuote |
| Systemeinstellungen | `/admin/settings` | Settings |
| Berichte & Analysen | `/admin/reports` | Analytics |

### TR-6: API Health Integration

```typescript
// Bestehender Endpoint: /api/health
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  checks: {
    database: boolean;
    clerk: boolean;
    stripe: boolean;
  };
}

// In Reports & Analytics anzeigen
```

### TR-7: User Management mit Clerk-Daten

```typescript
// Clerk User-Daten anzeigen
interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  lastSignInAt: Date;
  isOutperformer: boolean; // Aus DB (siehe Spec 014)
}
```

### TR-8: Curriculum-Seminarmaterial-Verlinkung

```typescript
// Bestehendes Feature aus Spec 016
interface CurriculumItem {
  id: string;
  title: string;
  // ...
  courseMaterialId?: string; // Verknüpfung zu Seminarmaterial
}
```

### TR-9: Input-Felder mit Placeholder und Subtitle

```typescript
// Alle Input-Felder erhalten:
<TextField
  label="Kurstitel"
  placeholder="z.B. Grundkurs Laparoskopie"
  helperText="Der Titel wird in der Kursübersicht angezeigt"
  // ...
/>
```

### TR-10: Kurs-Veröffentlichungs-Toggle

```typescript
// Toggle ersetzt Status-Spalte und "Veröffentlichen"-Button
<Switch
  checked={course.isPublished}
  onChange={() => togglePublishStatus(course.id)}
  inputProps={{ 'aria-label': 'Veröffentlichungsstatus' }}
/>
// Label: "Veröffentlicht" / "Unveröffentlicht"
```

### TR-11: Standortverwaltung Layout-Angleichung

- Suchfunktion entfernen
- Gleiches Tabellen-Layout wie Kursverwaltung
- Gleiche Spaltenstruktur und Abstände

## UI/UX Requirements

### UX-1: Website Header Breite
- Der Website-Header (`components/navigation/`) muss dieselbe Maximalbreite wie das Admin Dashboard haben
- Zentrierte Ausrichtung beibehalten

### UX-2: Entfernte Elemente
- ❌ Footer auf Admin Dashboard entfernen
- ❌ Willkommensnachricht auf Admin Dashboard entfernen

### UX-3: Deutsche Lokalisierung

| English | Deutsch |
|---------|---------|
| User Management | Benutzerverwaltung |
| Course Management | Kursverwaltung |
| Location Management | Standortverwaltung |
| Testimonial Management | Testimonial-Verwaltung |
| System Settings | Systemeinstellungen |
| Reports & Analytics | Berichte & Analysen |
| System Status | Systemstatus |
| Save | Speichern |
| Cancel | Abbrechen |
| Edit | Bearbeiten |
| Delete | Löschen |
| Add | Hinzufügen |
| Search | Suchen |
| Filter | Filtern |
| Outperformer | Outperformer |

### UX-4: Breadcrumb-Design
- Pfeil-Separator (`>`) zwischen Items
- Letztes Item nicht klickbar (aktuelle Seite)
- Hover-Effekt auf klickbaren Items

### UX-5: Dashboard-Karten Design
- Einheitliche Kartenhöhe
- Icon oben links
- Titel zentriert
- Hover-Effekt mit leichter Erhöhung (elevation)

## Acceptance Criteria

### AC-1: Layout
- [ ] Alle Admin-Unterseiten haben dieselbe Maximalbreite wie das Dashboard
- [ ] Website-Header hat dieselbe Maximalbreite
- [ ] Einheitlicher Head Space auf allen Unterseiten

### AC-2: Navigation
- [ ] Breadcrumb auf allen Admin-Unterseiten sichtbar
- [ ] Klick auf "Admin Dashboard" navigiert zurück
- [ ] Aktuelle Seite ist nicht klickbar

### AC-3: Dashboard
- [ ] 3-Spalten-Grid mit 6 Karten
- [ ] Kein Footer sichtbar
- [ ] Keine Willkommensnachricht sichtbar
- [ ] Alle Texte in Deutsch

### AC-4: Benutzerverwaltung
- [ ] Clerk-Benutzerdaten werden angezeigt
- [ ] Outperformer-Checkbox pro Benutzer
- [ ] Checkbox-Änderung wird gespeichert
- [ ] Benutzer löschen möglich
- [ ] Rolle zuweisen möglich (Admin/User)
- [ ] Filter "Nur Outperformer anzeigen" verfügbar

### AC-5: Kursverwaltung
- [ ] Curriculum-Items zeigen Seminarmaterial-Feld
- [ ] Verlinkung zu bestehendem Seminarmaterial möglich
- [ ] Status-Spalte ersetzt durch Toggle "Veröffentlicht"/"Unveröffentlicht"
- [ ] Toggle ändert Status direkt per Klick
- [ ] Spalte "Veröffentlichen" entfernt

### AC-5a: Standortverwaltung
- [ ] Suchfunktion entfernt
- [ ] Layout identisch mit Kursverwaltung
- [ ] Gleiche Tabellenstruktur und Abstände

### AC-6: Berichte & Analysen
- [ ] API Health-Daten werden angezeigt
- [ ] Systemstatus ist hier integriert
- [ ] Daten werden manuell aktualisiert (bei Seitenaufruf + Refresh-Button)
- [ ] Buchungsstatistiken (Anzahl Buchungen, Umsatz)
- [ ] Kursauslastung pro Kurs
- [ ] Benutzer-Wachstum (neue Registrierungen)

### AC-7: Input-Felder
- [ ] Alle Input-Felder haben Placeholder-Text
- [ ] Alle Input-Felder haben Hilfetext (Subtitle)

## Dependencies

- **Spec 014**: Outperformer-Checkbox Definition
- **Spec 016**: Seminarmaterial-Verlinkung (Course Assignments)
- **API Health Endpoint**: `/api/health` (bereits implementiert)
- **Clerk SDK**: Für Benutzerdaten

## File Changes (Estimated)

| Datei | Änderung |
|-------|----------|
| `app/admin/page.tsx` | Dashboard-Redesign, Footer/Welcome entfernen |
| `app/admin/layout.tsx` | Breadcrumb, einheitliche Breite |
| `components/admin/AdminBreadcrumb.tsx` | Neue Komponente |
| `components/admin/DashboardCard.tsx` | Neue/überarbeitete Komponente |
| `components/admin/AdminPageContainer.tsx` | Wrapper mit Head Space |
| `app/admin/users/page.tsx` | Clerk-Integration, Outperformer |
| `app/admin/courses/*/page.tsx` | Seminarmaterial-Feld |
| `app/admin/reports/page.tsx` | Health-Status, Systemstatus |
| `components/navigation/Header.tsx` | Breitenanpassung |
| `lib/constants/admin.ts` | Layout-Konstanten |

## Open Questions

1. ~~Soll der Systemstatus aus `/admin/settings` komplett nach Reports verschoben werden?~~ → Ja, komplett verschieben
2. ~~Welche zusätzlichen Metriken sollen in Reports & Analytics angezeigt werden?~~ → Buchungen, Kursauslastung, Benutzer-Wachstum
3. ~~Soll die Outperformer-Liste filterbar/exportierbar sein?~~ → Nur filterbar (kein Export)

## Clarifications

### Session 2026-02-04
- Q: Welches Aktualisierungsintervall für Health-Status in "Berichte & Analysen"? → A: Manuell (bei Seitenaufruf + Refresh-Button)
- Q: Welche Aktionen soll Admin auf Benutzer ausführen können? → A: Ansicht + Löschen + Rolle zuweisen
- Q: Systemstatus aus Settings nach Reports verschieben? → A: Ja, komplett verschieben (aus Settings entfernen)
- Q: Outperformer-Liste filterbar/exportierbar? → A: Nur filterbar (Checkbox "Nur Outperformer anzeigen")
- Q: Welche Metriken in Reports & Analytics? → A: Health + Buchungen + Kursauslastung + Benutzer-Wachstum
