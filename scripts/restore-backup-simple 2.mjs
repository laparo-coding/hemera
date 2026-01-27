import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lade DATABASE_URL aus .env.local falls nicht gesetzt
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const dbUrlMatch = envContent.match(/^DATABASE_URL=(.*)$/m);
    if (dbUrlMatch) {
      process.env.DATABASE_URL = dbUrlMatch[1].replace(/^["']|["']$/g, '');
      console.log('✅ DATABASE_URL geladen aus .env.local');
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL nicht gefunden in .env.local');
  process.exit(1);
}

console.log('🔗 Verbinde mit Datenbank...');
const prisma = new PrismaClient();
const backupDir = process.argv[2];

if (!backupDir) {
  console.error('❌ Backup-Verzeichnis erforderlich');
  process.exit(1);
}

console.log('📂 Backup-Verzeichnis:', backupDir);

const deleteOrder = [
  'CourseParticipation',
  'Booking',
  'ParticipationDocument',
  'ParticipationSummaryOverride',
  'CourseSummaryAsset',
  'Testimonial',
  'Course',
  'Location',
  'User',
];
const createOrder = deleteOrder.slice().reverse();

try {
  await prisma.$transaction(
    async tx => {
      // Lösche bestehende Daten
      console.log('\n🗑️  Lösche bestehende Daten...');
      for (const model of deleteOrder) {
        const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
        try {
          if (tx[modelLower]) {
            const result = await tx[modelLower].deleteMany();
            console.log(`   ✅ ${model}: ${result.count} gelöscht`);
          }
        } catch (e) {
          console.log(`   ⚠️ ${model}: übersprungen (${e.code || 'error'})`);
        }
      }

      // Importiere Daten
      console.log('\n📥 Importiere Backup-Daten...');
      for (const model of createOrder) {
        const filePath = path.join(backupDir, `${model}.json`);
        const modelLower = model.charAt(0).toLowerCase() + model.slice(1);

        if (fs.existsSync(filePath)) {
          const rawData = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(rawData);

          if (Array.isArray(data) && data.length > 0) {
            // Konvertiere Datum-Strings zu Date-Objekten
            const processedData = data.map(item => {
              const processed = { ...item };
              for (const [key, value] of Object.entries(processed)) {
                if (
                  typeof value === 'string' &&
                  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
                ) {
                  processed[key] = new Date(value);
                }
              }
              return processed;
            });

            if (tx[modelLower]) {
              const result = await tx[modelLower].createMany({
                data: processedData,
                skipDuplicates: true,
              });
              console.log(`   ✅ ${model}: ${result.count} importiert`);
            }
          } else {
            console.log(`   ⏭️  ${model}: keine Daten`);
          }
        } else {
          console.log(`   ⏭️  ${model}: Datei nicht gefunden`);
        }
      }
    },
    { timeout: 60000 }
  );

  console.log('\n✅ Restore erfolgreich!');
  await prisma.$disconnect();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Fehler beim Restore:', error.message);
  await prisma.$disconnect();
  process.exit(1);
}
