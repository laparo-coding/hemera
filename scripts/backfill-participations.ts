/**
 * Backfill participation records for existing bookings
 *
 * Creates CourseParticipation entries for all PAID bookings that don't have one yet.
 *
 * Run with: PRISMA_ACCELERATE_URL="..." npx tsx scripts/backfill-participations.ts
 */

import { prisma } from '../lib/db/prisma';

async function backfillParticipations() {
  console.log('🔍 Checking bookings without participation records...\n');

  // Get all bookings with PAID or CONFIRMED status (both indicate successful payment)
  const bookings = await prisma.booking.findMany({
    where: {
      paymentStatus: { in: ['PAID', 'CONFIRMED'] },
    },
    select: { id: true, userId: true, courseId: true, paymentStatus: true },
  });

  console.log(`Found ${bookings.length} paid booking(s)`);

  // Check which ones already have participation records
  const existingParticipations = await prisma.courseParticipation.findMany({
    select: { bookingId: true },
  });

  const existingBookingIds = new Set(
    existingParticipations.map(p => p.bookingId)
  );

  const bookingsWithoutParticipation = bookings.filter(
    b => !existingBookingIds.has(b.id)
  );

  console.log(
    `${bookingsWithoutParticipation.length} booking(s) need participation records\n`
  );

  // Create participation records
  for (const booking of bookingsWithoutParticipation) {
    await prisma.courseParticipation.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        courseId: booking.courseId,
        status: 'PREPARATION',
      },
    });
    console.log(`✅ Created participation for booking ${booking.id}`);
  }

  console.log('\n🎉 Done!');
  await prisma.$disconnect();
}

backfillParticipations().catch(async e => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
