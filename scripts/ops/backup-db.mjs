#!/usr/bin/env node
/**
 * Database Backup Script
 *
 * Exports all Prisma models to JSON files.
 * Usage: BACKUP_DIR=./backup node scripts/ops/backup-db.mjs
 */

import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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
    await prisma.$disconnect();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backup();
