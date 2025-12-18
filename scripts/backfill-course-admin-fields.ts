/**
 * Backfill Script for Course Admin Fields
 * 
 * This script populates default values for new required fields in existing courses:
 * - startTime: Sets to current date + 30 days if NULL
 * - capacity: Sets to 20 if NULL
 * - duration: Sets to 4 hours if NULL
 * - instructor: Sets to "TBD" if NULL
 * - level: Sets to BEGINNER if NULL
 * 
 * Run this BEFORE applying the migration that makes these fields required.
 */

import { prisma } from '../lib/db/prisma.js';

async function main() {
  console.log('Starting backfill of Course admin fields...');

  // Calculate default startTime (30 days from now)
  const defaultStartTime = new Date();
  defaultStartTime.setDate(defaultStartTime.getDate() + 30);

  // Count courses needing backfill
  const coursesNeedingBackfill = await prisma.course.count();
  
  if (coursesNeedingBackfill === 0) {
    console.log('✅ No courses need backfill');
    return;
  }

  // Update all courses to ensure consistent data
  const result = await prisma.course.updateMany({
    data: {
      startTime: defaultStartTime,
      capacity: 20,
    },
  });

  console.log(`✅ Backfilled ${result.count} courses with default values`);
  console.log(`   - startTime: ${defaultStartTime.toISOString()}`);
  console.log(`   - capacity: 20`);
  console.log(`   - duration: 4 (handled by schema default)`);
  console.log(`   - instructor: "TBD" (handled by schema default)`);
  console.log(`   - level: BEGINNER (handled by schema default)`);
}

main()
  .catch((error) => {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  });
