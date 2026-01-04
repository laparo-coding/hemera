# Datenbank Backup & Restore

Diese Dokumentation beschreibt das automatische Backup-System für die Hemera PostgreSQL-Datenbank.

## Übersicht

Da Prisma Postgres (Free Plan) keine automatischen Backups enthält, nutzen wir GitHub Actions für tägliche Backups.

```
┌─────────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   Prisma Postgres   │ ──── │  GitHub Actions  │ ──── │  Artifacts (30 Tage)│
│   (db.prisma.io)    │      │  (daily-backup)  │      │  (Download möglich) │
└─────────────────────┘      └──────────────────┘      └─────────────────────┘
```

**Hinweis**: Da Prisma Postgres einen Connection Pooler verwendet (kein direkter PostgreSQL-Zugang),
nutzen wir Prisma Client für den Export statt `pg_dump`.

## Backup

### Automatisch (täglich)

Der Workflow `daily-backup.yml` läuft jeden Tag um **03:00 UTC** (04:00 MEZ).

- **Aufbewahrung**: 30 Tage
- **Format**: JSON-Dateien pro Tabelle (tar.gz komprimiert)
- **Speicherort**: GitHub Actions Artifacts

### Backup-Inhalt

Das Backup enthält JSON-Dateien für jede Tabelle:
- `User.json`
- `Course.json`
- `Booking.json`
- `Location.json`
- `CourseParticipation.json`
- `ParticipationDocument.json`
- `CourseSummaryAsset.json`
- `metadata.json` (Datum, Grund)

### Manuell

1. Gehe zu [Actions → Daily Database Backup](https://github.com/Laparo/hemera/actions/workflows/daily-backup.yml)
2. Klicke auf **"Run workflow"**
3. Optional: Gib einen Grund an
4. Klicke auf **"Run workflow"**

## Restore

### Backup herunterladen

1. Gehe zu [Actions → Daily Database Backup](https://github.com/Laparo/hemera/actions/workflows/daily-backup.yml)
2. Klicke auf einen erfolgreichen Workflow-Run
3. Scrolle zu **Artifacts**
4. Lade das Backup herunter (z.B. `db-backup-123-456789`)

### Wiederherstellung mit Script

```bash
# Im Projektverzeichnis
./scripts/ops/restore-db.sh hemera_backup_2025-01-04_03-00-00.tar.gz
```

Das Script:
- Lädt `DATABASE_URL` automatisch aus `.env.local` oder `.env`
- Fragt vor dem Überschreiben um Bestätigung
- Löscht bestehende Daten und importiert das Backup
- Beachtet die richtige Reihenfolge für Foreign Keys

### Manuelle Wiederherstellung

```bash
# Backup entpacken
tar -xzf hemera_backup_2025-01-04_03-00-00.tar.gz

# Im entpackten Ordner befinden sich JSON-Dateien pro Tabelle
# Diese können mit einem Node.js Script importiert werden
```

## Einrichtung

### 1. Secret hinzufügen

Die `DATABASE_URL` muss als GitHub Secret konfiguriert sein:

1. Gehe zu **Settings → Secrets and variables → Actions**
2. Klicke **New repository secret**
3. Name: `DATABASE_URL`
4. Value: Die vollständige Prisma Postgres Verbindungs-URL

### 2. Workflow aktivieren

Der Workflow wird automatisch aktiviert, sobald die Datei `.github/workflows/daily-backup.yml` im `main` Branch liegt.

## Troubleshooting

### Backup schlägt fehl

1. Prüfe, ob `DATABASE_URL` als Secret gesetzt ist
2. Prüfe die Workflow-Logs in GitHub Actions
3. Stelle sicher, dass die Datenbank erreichbar ist
4. Prüfe, ob alle Prisma-Modelle korrekt sind

### Restore schlägt fehl

1. Prüfe, ob Node.js installiert ist: `node --version`
2. Prüfe, ob `@prisma/client` generiert ist: `npx prisma generate`
3. Prüfe die `DATABASE_URL` Umgebungsvariable
4. Stelle sicher, dass das Backup-Archiv nicht beschädigt ist

## Empfehlungen

- **Vor großen Änderungen**: Manuelles Backup erstellen
- **Nach Deployment**: Prüfen, ob automatische Backups laufen
- **Regelmäßig**: Stichprobenartig ein Restore testen

## Technische Details

- **Backup-Methode**: Prisma Client `findMany()` für alle Models
- **Export-Format**: JSON mit vollständiger Datenstruktur
- **Foreign Keys**: Restore-Reihenfolge berücksichtigt Abhängigkeiten
- **Komprimierung**: tar + gzip für effiziente Speicherung
