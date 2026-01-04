#!/bin/bash
#
# Datenbank Restore Script für Hemera
# Stellt ein Backup aus GitHub Actions Artifacts wieder her
#
# Verwendung:
#   ./scripts/ops/restore-db.sh <backup-archive.tar.gz>
#   ./scripts/ops/restore-db.sh hemera_backup_2025-01-04_03-00-00.tar.gz
#
# Hinweis: 
#   Dieses Script importiert JSON-Daten, die mit dem Prisma-basierten
#   Backup erstellt wurden. Es überschreibt bestehende Daten.
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
    echo "  $0 <backup-archive.tar.gz>"
    echo ""
    echo "Beispiel:"
    echo "  $0 hemera_backup_2025-01-04_03-00-00.tar.gz"
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

# Prüfe ob .tar.gz
if [[ ! "$BACKUP_FILE" =~ \.tar\.gz$ ]]; then
    log_error "Backup-Datei muss eine .tar.gz Datei sein"
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

# Temporäres Verzeichnis erstellen
log_info "Entpacke Backup..."
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Finde das Backup-Verzeichnis
BACKUP_DIR=$(find "$TEMP_DIR" -type d -name "backup_*" | head -1)

if [ -z "$BACKUP_DIR" ]; then
    log_error "Kein gültiges Backup-Verzeichnis im Archiv gefunden"
    exit 1
fi

log_info "Backup-Verzeichnis: $BACKUP_DIR"
log_info "Starte Restore..."

# Node.js Script für Restore
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function restore() {
  const prisma = new PrismaClient();
  const backupDir = '$BACKUP_DIR';
  
  // Reihenfolge ist wichtig wegen Foreign Keys (abhängige Tabellen zuerst löschen)
  const deleteOrder = [
    'courseSummaryAsset',
    'participationDocument',
    'courseParticipation',
    'booking',
    'course',
    'location',
    'user'
  ];
  
  const createOrder = deleteOrder.slice().reverse();
  
  try {
    // Erst alle Daten löschen
    console.log('\\n🗑️  Lösche bestehende Daten...');
    for (const model of deleteOrder) {
      try {
        const result = await prisma[model].deleteMany();
        console.log('   ✅ ' + model + ': ' + result.count + ' gelöscht');
      } catch (e) {
        console.log('   ⚠️ ' + model + ': übersprungen');
      }
    }
    
    // Dann neue Daten importieren
    console.log('\\n📥 Importiere Backup-Daten...');
    for (const model of createOrder) {
      const modelCapitalized = model.charAt(0).toUpperCase() + model.slice(1);
      const filePath = path.join(backupDir, modelCapitalized + '.json');
      
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (data.length > 0) {
          // Konvertiere DateTime Strings zurück zu Date Objekten
          const convertDates = (item) => {
            const dateFields = ['createdAt', 'updatedAt', 'startDate', 'endDate', 'dateCompleted', 'uploadedAt'];
            const converted = { ...item };
            for (const field of dateFields) {
              if (converted[field]) {
                converted[field] = new Date(converted[field]);
              }
            }
            return converted;
          };
          
          const convertedData = data.map(convertDates);
          
          const result = await prisma[model].createMany({ 
            data: convertedData,
            skipDuplicates: true
          });
          console.log('   ✅ ' + modelCapitalized + ': ' + result.count + ' importiert');
        } else {
          console.log('   ⚠️ ' + modelCapitalized + ': keine Daten');
        }
      } else {
        console.log('   ⚠️ ' + modelCapitalized + ': keine Backup-Datei');
      }
    }
    
    await prisma.\$disconnect();
    console.log('\\n✅ Restore abgeschlossen!');
  } catch (error) {
    console.error('\\n❌ Restore fehlgeschlagen:', error.message);
    await prisma.\$disconnect();
    process.exit(1);
  }
}

restore();
"

echo ""
log_success "Datenbank erfolgreich wiederhergestellt!"
echo ""
echo "Nächste Schritte:"
echo "  1. Überprüfe die Daten in der Anwendung"
echo "  2. Starte ggf. den Entwicklungsserver neu"
