/**
 * Migration Script: Migrate User IDs from cuid to Clerk IDs
 *
 * This script migrates all users and their relations to use Clerk IDs directly.
 * Run this ONCE after deploying the schema change.
 *
 * Usage: npx tsx scripts/migrate-to-clerk-ids.ts
 */

import { clerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Clerk ID migration...\n');

  // 1. Get all users from DB
  const dbUsers = await prisma.user.findMany({
    include: { bookings: true },
  });

  console.log(`Found ${dbUsers.length} users in database\n`);

  // 2. Get Clerk users to map emails to Clerk IDs
  const clerk = await clerkClient();
  const clerkUsers = await clerk.users.getUserList({ limit: 500 });
  const emailToClerkId = new Map<string, string>();

  for (const clerkUser of clerkUsers.data) {
    const email = clerkUser.primaryEmailAddress?.emailAddress;
    if (email) {
      emailToClerkId.set(email.toLowerCase(), clerkUser.id);
    }
  }

  console.log(`Found ${clerkUsers.data.length} users in Clerk\n`);

  // 3. Migrate each user
  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const dbUser of dbUsers) {
    // Skip if already a Clerk ID
    if (dbUser.id.startsWith('user_')) {
      console.log(`✓ User ${dbUser.id} already has Clerk ID, skipping`);
      skippedCount++;
      continue;
    }

    // Find matching Clerk ID by email
    const email = dbUser.email?.toLowerCase();
    if (!email) {
      console.log(`⚠ User ${dbUser.id} has no email, skipping`);
      skippedCount++;
      continue;
    }

    const clerkId = emailToClerkId.get(email);
    if (!clerkId) {
      console.log(`⚠ No Clerk user found for email ${email}, skipping`);
      skippedCount++;
      continue;
    }

    try {
      // Use a transaction to update user ID and all relations
      await prisma.$transaction(async tx => {
        // Create new user with Clerk ID
        await tx.user.create({
          data: {
            id: clerkId,
            name: dbUser.name,
            email: dbUser.email,
            emailVerified: dbUser.emailVerified,
            image: dbUser.image,
            createdAt: dbUser.createdAt,
          },
        });

        // Update all bookings to point to new user ID
        await tx.booking.updateMany({
          where: { userId: dbUser.id },
          data: { userId: clerkId },
        });

        // Delete old user
        await tx.user.delete({
          where: { id: dbUser.id },
        });
      });

      console.log(`✓ Migrated user ${dbUser.email}: ${dbUser.id} → ${clerkId}`);
      migratedCount++;
    } catch (error) {
      console.error(`✗ Failed to migrate user ${dbUser.id}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Migrated: ${migratedCount}`);
  console.log(`   Skipped:  ${skippedCount}`);
  console.log(`   Errors:   ${errorCount}`);
  console.log('\n✅ Migration complete!');
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
