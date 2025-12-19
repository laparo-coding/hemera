#!/usr/bin/env node

/**
 * Quickstart Validation Script
 *
 * Automated validation of quickstart checklist items
 * for the Course Admin Interface feature.
 *
 * Run: node scripts/validate-quickstart-admin.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('✅ Quickstart Validation for Course Admin Interface\n');
console.log('═'.repeat(60));
console.log('\n');

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

/**
 * Check prerequisite: Environment variables
 */
async function checkEnvironmentVariables() {
  console.log('📋 Checking Environment Variables...\n');

  const required = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'BLOB_READ_WRITE_TOKEN',
    'ROLLBAR_ACCESS_TOKEN',
  ];

  for (const envVar of required) {
    if (envVar in process.env) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar} configured`);
        results.passed.push(`Environment: ${envVar}`);
      } else {
        console.log(
          `   ⚠️  ${envVar} defined but empty (set before deployment)`
        );
        results.warnings.push(`Environment: ${envVar} empty`);
      }
    } else {
      console.log(`   ❌ ${envVar} missing`);
      results.failed.push(`Environment: ${envVar}`);
    }
  }

  console.log('\n');
}

/**
 * Check prerequisite: Database schema
 */
async function checkDatabaseSchema() {
  console.log('📋 Checking Database Schema...\n');

  // Check if schema file exists
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Check for Course model
    if (schemaContent.includes('model Course')) {
      console.log('   ✅ Course model exists in schema');
      results.passed.push('Schema: Course model');

      // Check required fields
      const requiredFields = [
        'id',
        'title',
        'description',
        'slug',
        'price',
        'startTime',
        'duration',
        'instructor',
        'level',
        'capacity',
      ];

      for (const field of requiredFields) {
        if (schemaContent.includes(field)) {
          console.log(`   ✅ Course.${field} in schema`);
          results.passed.push(`Schema: Course.${field}`);
        } else {
          console.log(`   ❌ Course.${field} missing`);
          results.failed.push(`Schema: Course.${field}`);
        }
      }
    } else {
      console.log('   ❌ Course model not found in schema');
      results.failed.push('Schema: Course model');
    }

    // Check CourseLevel enum
    if (schemaContent.includes('enum CourseLevel')) {
      console.log('   ✅ CourseLevel enum exists');
      results.passed.push('Schema: CourseLevel enum');
    } else {
      console.log('   ❌ CourseLevel enum missing');
      results.failed.push('Schema: CourseLevel enum');
    }
  } else {
    console.log('   ❌ Schema file not found');
    results.failed.push('Schema: prisma/schema.prisma');
  }

  console.log('\n');
}

/**
 * Check file structure
 */
async function checkFileStructure() {
  console.log('📋 Checking File Structure...\n');

  const requiredFiles = [
    'lib/schemas/admin/course.ts',
    'lib/types/admin.ts',
    'lib/db/admin/courses.ts',
    'lib/actions/admin/courses.ts',
    'lib/auth/admin.ts',
    'lib/utils/fileUpload.ts',
    'app/api/admin/courses/route.ts',
    'app/api/admin/courses/[id]/route.ts',
    'app/api/upload/thumbnail/route.ts',
    'app/admin/layout.tsx',
    'app/admin/courses/page.tsx',
    'app/admin/courses/new/page.tsx',
    'app/admin/courses/[id]/edit/page.tsx',
    'app/admin/courses/[id]/delete/page.tsx',
    'components/admin/CourseForm.tsx',
    'components/admin/CourseList.tsx',
    'components/admin/CourseCard.tsx',
    'components/admin/DeleteConfirmation.tsx',
    'components/admin/FileUpload.tsx',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
      results.passed.push(`Files: ${file}`);
    } else {
      console.log(`   ❌ ${file} missing`);
      results.failed.push(`Files: ${file}`);
    }
  }

  console.log('\n');
}

/**
 * Check test coverage
 */
async function checkTestCoverage() {
  console.log('📋 Checking Test Coverage...\n');

  const testFiles = [
    'tests/contracts/admin/courses.spec.ts',
    'tests/e2e/admin-course-create.spec.ts',
    'tests/e2e/admin-course-edit.spec.ts',
    'tests/e2e/admin-course-delete.spec.ts',
  ];

  for (const file of testFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
      results.passed.push(`Tests: ${file}`);
    } else {
      console.log(`   ❌ ${file} missing`);
      results.failed.push(`Tests: ${file}`);
    }
  }

  console.log('\n');
}

/**
 * Check database can create/read/update/delete courses
 */
async function checkDatabaseOperations() {
  console.log('📋 Checking Database Operations...\n');
  console.log('   ⚠️  Database operations check skipped (requires running app)');
  console.log('   Run manual tests using the quickstart guide\n');
  results.warnings.push(
    'Database: CRUD operations not tested (run manual quickstart)'
  );
}

/**
 * Print summary
 */
function printSummary() {
  console.log('═'.repeat(60));
  console.log('\n📊 Validation Summary\n');

  console.log(`   ✅ Passed: ${results.passed.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);
  console.log(`   ⚠️  Warnings: ${results.warnings.length}\n`);

  if (results.failed.length > 0) {
    console.log('Failed Checks:');
    for (const item of results.failed) {
      console.log(`   - ${item}`);
    }
    console.log('\n');
  }

  if (results.warnings.length > 0) {
    console.log('Warnings:');
    for (const item of results.warnings) {
      console.log(`   - ${item}`);
    }
    console.log('\n');
  }

  if (results.failed.length === 0) {
    console.log('✅ All validation checks passed!\n');
    console.log('You can now proceed with manual quickstart testing.');
    console.log(
      'Follow the steps in specs/014-create-an-admin/quickstart.md\n'
    );
    return 0;
  } else {
    console.log('❌ Some validation checks failed.\n');
    console.log('Please address the failed checks before proceeding.\n');
    return 1;
  }
}

/**
 * Main execution
 */
async function main() {
  await checkEnvironmentVariables();
  await checkDatabaseSchema();
  await checkFileStructure();
  await checkTestCoverage();
  await checkDatabaseOperations();

  const exitCode = printSummary();

  process.exit(exitCode);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
