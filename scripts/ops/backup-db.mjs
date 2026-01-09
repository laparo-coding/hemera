#!/usr/bin/env node
/**
 * Database Backup Script
 *
 * Exports all Prisma models to JSON files.
 * Usage: BACKUP_DIR=./backup node scripts/ops/backup-db.mjs
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

async function backup() {
  // Create PG pool and adapter for direct connection (Prisma 7 client engine)
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  const backupDir = process.env.BACKUP_DIR || './backup';
  let hasErrors = false;

  try {
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Get all model names dynamically from Prisma
    const models = Object.values(Prisma.ModelName);
    console.log('📋 Models to backup: ' + models.join(', '));

    for (const model of models) {
      try {
        const modelName = model.charAt(0).toLowerCase() + model.slice(1);
        const data = await prisma[modelName].findMany();
        fs.writeFileSync(
          path.join(backupDir, model + '.json'),
          JSON.stringify(data, null, 2)
        );
        console.log('✅ ' + model + ': ' + data.length + ' records');
      } catch (e) {
        hasErrors = true;
        console.log(
          '⚠️ ' +
            model +
            ': skipped (' +
            e.code +
            ': ' +
            (e.message || 'unknown error').substring(0, 50) +
            ')'
        );
      }
    }

    console.log(
      '\n✅ Backup completed!' + (hasErrors ? ' (with warnings)' : '')
    );
  } catch (error) {
    console.error('❌ Backup failed: ' + (error.message || 'Unknown error'));
    // Re-throw to let finally run, then exit with error code
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

backup().catch(() => {
  process.exit(1);
});
