/**
 * Script to fix course prices and booking amounts
 *
 * This script multiplies all course prices and booking amounts by 100
 * to convert from Euro to Cents (Stripe convention).
 *
 * Run with: npx tsx scripts/fix-prices.ts
 */

import { prisma } from '../lib/db/prisma';

async function fixPrices() {
  console.log('🔍 Checking current prices...\n');

  // Get all courses
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, price: true },
  });

  console.log('=== Current Courses ===');
  for (const c of courses) {
    const needsFix = c.price < 10000; // Prices below 100€ in cents are likely Euro values
    console.log(`Course: ${c.title}`);
    console.log(`  Current price: ${c.price}`);
    console.log(`  Displays as: ${(c.price / 100).toFixed(2)}€`);
    console.log(
      `  Needs fix: ${needsFix ? 'YES (will multiply by 100)' : 'NO'}`
    );
    console.log('');
  }

  // Get all bookings
  const bookings = await prisma.booking.findMany({
    select: { id: true, amount: true, currency: true },
  });

  console.log('=== Current Bookings ===');
  for (const b of bookings) {
    const needsFix = b.amount < 10000;
    console.log(`Booking: ${b.id}`);
    console.log(`  Current amount: ${b.amount} ${b.currency}`);
    console.log(`  Displays as: ${(b.amount / 100).toFixed(2)}€`);
    console.log(`  Needs fix: ${needsFix ? 'YES' : 'NO'}`);
    console.log('');
  }

  // Ask for confirmation
  console.log('----------------------------------------');
  console.log('⚠️  This will multiply prices/amounts by 100');
  console.log('    for all values that appear to be in Euro.');
  console.log('----------------------------------------\n');

  // Fix courses with prices that look like Euro values
  const coursesToFix = courses.filter(c => c.price < 10000 && c.price > 0);
  if (coursesToFix.length > 0) {
    console.log(`📝 Fixing ${coursesToFix.length} course(s)...`);
    for (const course of coursesToFix) {
      const newPrice = course.price * 100;
      await prisma.course.update({
        where: { id: course.id },
        data: { price: newPrice },
      });
      console.log(`  ✅ ${course.title}: ${course.price} → ${newPrice}`);
    }
  } else {
    console.log('✅ No courses need fixing.');
  }

  // Fix bookings with amounts that look like Euro values
  const bookingsToFix = bookings.filter(b => b.amount < 10000 && b.amount > 0);
  if (bookingsToFix.length > 0) {
    console.log(`\n📝 Fixing ${bookingsToFix.length} booking(s)...`);
    for (const booking of bookingsToFix) {
      const newAmount = booking.amount * 100;
      await prisma.booking.update({
        where: { id: booking.id },
        data: { amount: newAmount },
      });
      console.log(`  ✅ ${booking.id}: ${booking.amount} → ${newAmount}`);
    }
  } else {
    console.log('✅ No bookings need fixing.');
  }

  console.log('\n🎉 Done!');
  await prisma.$disconnect();
}

fixPrices().catch(async e => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
