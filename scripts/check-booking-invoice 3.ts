import { prisma } from '../lib/db/prisma';

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      course: {
        title: { contains: 'zielsicher', mode: 'insensitive' },
      },
    },
    include: { course: { select: { title: true, price: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  for (const b of bookings) {
    console.log('---');
    console.log('Booking ID:', b.id);
    console.log('Course:', b.course.title);
    console.log('Price:', b.course.price?.toString());
    console.log('stripeSessionId:', b.stripeSessionId || 'NULL');
    console.log('stripeInvoiceId:', b.stripeInvoiceId || 'NULL');
    console.log('stripeInvoicePdfUrl:', b.stripeInvoicePdfUrl || 'NULL');
  }

  if (bookings.length === 0) {
    console.log('Keine Buchungen gefunden');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
