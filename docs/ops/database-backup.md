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

## Backup

### Automatisch (täglich)

Der Workflow `daily-backup.yml` läuft jeden Tag um **03:00 UTC** (04:00 MEZ).

- **Aufbewahrung**: 30 Tage
- **Format**: SQL (gzip-komprimiert)
- **Speicherort**: GitHub Actions Artifacts

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
./scripts/ops/restore-db.sh hemera_backup_2026-01-04_03-00-00.sql.gz
```

Das Script:
- Lädt `DATABASE_URL` automatisch aus `.env.local` oder `.env`
- Fragt vor dem Überschreiben um Bestätigung
- Entpackt und führt das SQL-Backup aus

### Manuelle Wiederherstellung

```bash
# Backup entpacken
gunzip hemera_backup_2026-01-04_03-00-00.sql.gz

# Wiederherstellen
psql "$DATABASE_URL" < hemera_backup_2026-01-04_03-00-00.sql
```

## Einrichtung

### 1. Secret hinzufügen

Die `DATABASE_URL` muss als GitHub Secret konfiguriert sein:

1. Gehe zu **Settings → Secrets and variables → Actions**
2. Klicke **New repository secret**
3. Name: `DATABASE_URL`
4. Value: Die vollständige PostgreSQL-Verbindungs-URL

### 2. Workflow aktivieren

Der Workflow wird automatisch aktiviert, sobald die Datei `.github/workflows/daily-backup.yml` im `main` Branch liegt.

## Troubleshooting

### Backup schlägt fehl

1. Prüfe, ob `DATABASE_URL` als Secret gesetzt ist
2. Prüfe die Workflow-Logs in GitHub Actions
3. Stelle sicher, dass die Datenbank erreichbar ist

### Restore schlägt fehl

1. Prüfe die PostgreSQL-Client-Installation: `psql --version`
2. Prüfe die `DATABASE_URL` Umgebungsvariable
3. Stelle sicher, dass das Backup-File nicht beschädigt ist

## Empfehlungen

- **Vor großen Änderungen**: Manuelles Backup erstellen
- **Nach Deployment**: Prüfen, ob automatische Backups laufen
- **Regelmäßig**: Stichprobenartig ein Restore testen

## Technische Details

- **pg_dump Optionen**:
  - `--no-owner`: Keine Besitzerrechte (für verschiedene Umgebungen)
  - `--no-acl`: Keine Zugriffsrechte
  - `--clean`: DROP-Statements vor CREATE
  - `--if-exists`: Fehler vermeiden bei nicht vorhandenen Objekten
