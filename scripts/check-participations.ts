import { prisma } from '../lib/db/prisma';

async function check() {
  const participations = await prisma.courseParticipation.findMany({
    include: {
      booking: {
        include: {
          course: true,
        },
      },
    },
  });
  console.log('Participations:', JSON.stringify(participations, null, 2));

  // Also check the user ID
  const bookings = await prisma.booking.findMany({
    include: { user: true, course: true },
  });
  console.log('\nBookings with users:', JSON.stringify(bookings, null, 2));

  await prisma.$disconnect();
}

void check();
