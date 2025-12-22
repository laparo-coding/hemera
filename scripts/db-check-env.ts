#!/usr/bin/env node
/**
 * Database Environment Check Script
 *
 * This script checks and displays the current database environment,
 * warning if connected to a production database.
 *
 * Usage: npm run db:check-env
 */

import {
  checkProductionDatabase,
  getDatabaseEnvironmentInfo,
} from '../lib/db/production-guard.js';

function main() {
  console.log('\n🔍 Database Environment Check\n');
  console.log('─'.repeat(50));

  const check = checkProductionDatabase();

  console.log(`\nStatus: ${getDatabaseEnvironmentInfo()}\n`);

  if (check.reasons.length > 0) {
    console.log('Detection reasons:');
    for (const reason of check.reasons) {
      console.log(`  • ${reason}`);
    }
    console.log();
  }

  if (check.isProduction) {
    console.log('⚠️  WARNING: Destructive operations (deleteMany, truncate)');
    console.log('   will be BLOCKED on this database.\n');
    console.log('   To override (DANGEROUS):');
    console.log('   Set ALLOW_DESTRUCTIVE_DB_OPS=true\n');
    process.exit(1);
  } else if (check.canOverride) {
    console.log('⚠️  Override active: Destructive operations are ALLOWED');
    console.log('   despite production indicators.\n');
  } else {
    console.log('✅ Safe for development operations.\n');
  }

  console.log('─'.repeat(50));
}

main();
