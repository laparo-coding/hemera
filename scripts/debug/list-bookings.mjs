import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const bookings = await prisma.booking.findMany({
    include: {
      course: {
        select: {
          title: true,
          price: true,
          currency: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!bookings.length) {
    console.log('Keine Buchungen gefunden.');
  } else {
    console.log(`Gefundene Buchungen: ${bookings.length}`);
    bookings.forEach((booking, index) => {
      console.log(
        `${index + 1}. Booking ${booking.id} | Kurs: ${booking.course.title} | ` +
          `User: ${booking.user?.email ?? booking.userId} | Status: ${booking.paymentStatus} | ` +
          `Betrag: ${(booking.amount ?? 0) / 100} ${booking.currency}`
      );
    });
  }
} catch (error) {
  console.error('Fehler beim Abrufen der Buchungen:', error);
} finally {
  await prisma.$disconnect();
}
