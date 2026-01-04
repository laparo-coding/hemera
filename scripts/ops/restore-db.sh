#!/bin/bash
#
# Datenbank Restore Script für Hemera
# Stellt ein Backup aus GitHub Actions Artifacts wieder her
#
# Verwendung:
#   ./scripts/ops/restore-db.sh <backup-file.sql.gz>
#   ./scripts/ops/restore-db.sh hemera_backup_2026-01-04_03-00-00.sql.gz
#
# Voraussetzungen:
#   - PostgreSQL Client (psql) installiert
#   - DATABASE_URL Umgebungsvariable gesetzt ODER .env.local vorhanden
#

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Hilfsfunktionen
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Prüfe Argumente
if [ -z "$1" ]; then
    echo ""
    echo "📋 Hemera Datenbank Restore"
    echo "=============================="
    echo ""
    echo "Verwendung:"
    echo "  $0 <backup-file.sql.gz>"
    echo ""
    echo "Beispiel:"
    echo "  $0 hemera_backup_2026-01-04_03-00-00.sql.gz"
    echo ""
    echo "So erhältst du ein Backup:"
    echo "  1. Gehe zu https://github.com/Laparo/hemera/actions"
    echo "  2. Wähle 'Daily Database Backup'"
    echo "  3. Klicke auf einen erfolgreichen Run"
    echo "  4. Lade das Artifact herunter"
    echo ""
    exit 1
fi

BACKUP_FILE="$1"

# Prüfe ob Datei existiert
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup-Datei nicht gefunden: $BACKUP_FILE"
    exit 1
fi

# Lade DATABASE_URL aus .env.local falls nicht gesetzt
if [ -z "$DATABASE_URL" ]; then
    if [ -f ".env.local" ]; then
        log_info "Lade DATABASE_URL aus .env.local..."
        export $(grep -E '^DATABASE_URL=' .env.local | xargs)
    elif [ -f ".env" ]; then
        log_info "Lade DATABASE_URL aus .env..."
        export $(grep -E '^DATABASE_URL=' .env | xargs)
    fi
fi

# Prüfe DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL nicht gesetzt!"
    echo "Setze die Umgebungsvariable oder erstelle eine .env.local Datei."
    exit 1
fi

# Warnung anzeigen
echo ""
log_warn "ACHTUNG: Dies überschreibt alle Daten in der Datenbank!"
echo ""
echo "Ziel-Datenbank: ${DATABASE_URL:0:50}..."
echo "Backup-Datei:   $BACKUP_FILE"
echo ""
read -p "Bist du sicher? (ja/nein): " CONFIRM

if [ "$CONFIRM" != "ja" ]; then
    log_info "Abgebrochen."
    exit 0
fi

# Temporäre Datei für entpacktes SQL
SQL_FILE="${BACKUP_FILE%.gz}"
TEMP_SQL=""

# Entpacken falls .gz
if [[ "$BACKUP_FILE" == *.gz ]]; then
    log_info "Entpacke Backup..."
    TEMP_SQL=$(mktemp)
    gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"
    SQL_FILE="$TEMP_SQL"
fi

# Restore durchführen
log_info "Stelle Datenbank wieder her..."
echo ""

if psql "$DATABASE_URL" < "$SQL_FILE"; then
    log_success "Datenbank erfolgreich wiederhergestellt!"
else
    log_error "Restore fehlgeschlagen!"
    # Aufräumen
    [ -n "$TEMP_SQL" ] && rm -f "$TEMP_SQL"
    exit 1
fi

# Aufräumen
[ -n "$TEMP_SQL" ] && rm -f "$TEMP_SQL"

echo ""
log_success "Restore abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "  1. Starte den Dev-Server neu: npm run dev"
echo "  2. Prüfe die Daten unter http://localhost:3000"
echo ""
