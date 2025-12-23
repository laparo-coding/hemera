/**
 * Apply the naming convention migration to the database
 */
import { prisma } from '../lib/db/prisma.js';

async function main() {
  console.log('🔄 Applying naming convention migration...\n');

  // Step 1: Rename tables
  const tableRenames = [
    ['User', 'users'],
    ['Account', 'accounts'],
    ['VerificationToken', 'verification_tokens'],
  ];

  for (const [oldName, newName] of tableRenames) {
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE IF EXISTS "${oldName}" RENAME TO "${newName}"`
      );
      console.log(`✓ Renamed table ${oldName} → ${newName}`);
    } catch (e: unknown) {
      const error = e as Error;
      console.log(`⚠ Table ${oldName}: ${error.message}`);
    }
  }

  // Step 2: Add missing columns to users
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
    `);
    console.log('✓ Added created_at/updated_at to users');
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`⚠ Users timestamps: ${error.message}`);
  }

  // Step 3: Rename columns
  const columnRenames = [
    // users
    ['users', 'emailVerified', 'email_verified'],
    // accounts
    ['accounts', 'userId', 'user_id'],
    ['accounts', 'providerAccountId', 'provider_account_id'],
    ['accounts', 'expiresAt', 'expires_at'],
    // courses
    ['courses', 'startDate', 'start_date'],
    ['courses', 'startTime', 'start_time'],
    ['courses', 'endTime', 'end_time'],
    ['courses', 'isPublished', 'is_published'],
    ['courses', 'createdAt', 'created_at'],
    ['courses', 'updatedAt', 'updated_at'],
    ['courses', 'thumbnailUrl', 'thumbnail_url'],
    // bookings
    ['bookings', 'userId', 'user_id'],
    ['bookings', 'courseId', 'course_id'],
    ['bookings', 'paymentStatus', 'payment_status'],
    ['bookings', 'stripePaymentIntentId', 'stripe_payment_intent_id'],
    ['bookings', 'stripeSessionId', 'stripe_session_id'],
    ['bookings', 'createdAt', 'created_at'],
    ['bookings', 'updatedAt', 'updated_at'],
  ];

  for (const [table, oldCol, newCol] of columnRenames) {
    try {
      // Check if column exists first
      const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = '${oldCol}'
        ) as exists
      `);

      if (result[0]?.exists) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "${table}" RENAME COLUMN "${oldCol}" TO "${newCol}"`
        );
        console.log(`✓ Renamed ${table}.${oldCol} → ${newCol}`);
      }
    } catch (e: unknown) {
      const error = e as Error;
      console.log(`⚠ ${table}.${oldCol}: ${error.message}`);
    }
  }

  // Step 4: Update default currency
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "courses" ALTER COLUMN "currency" SET DEFAULT 'EUR'
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "bookings" ALTER COLUMN "currency" SET DEFAULT 'EUR'
    `);
    console.log('✓ Updated default currency to EUR');
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`⚠ Currency default: ${error.message}`);
  }

  // Step 5: Update constraints
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "Booking_userId_courseId_key"
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_user_id_course_id_key"
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_course_id_key" UNIQUE ("user_id", "course_id")
    `);
    console.log('✓ Updated bookings unique constraint');
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`⚠ Constraint: ${error.message}`);
  }

  // Step 6: Update indexes
  try {
    await prisma.$executeRawUnsafe(
      `DROP INDEX IF EXISTS "Course_startDate_idx"`
    );
    await prisma.$executeRawUnsafe(
      `DROP INDEX IF EXISTS "courses_start_date_idx"`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "courses_start_date_idx" ON "courses"("start_date")`
    );
    console.log('✓ Updated courses index');
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`⚠ Index: ${error.message}`);
  }

  console.log('\n✅ Migration complete!');

  // Verify
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  console.log('\nTables:', tables.map(t => t.table_name).join(', '));
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
