/* cspell:disable -- contains generated IDs */
import { prisma } from '../lib/db/prisma';

async function main() {
  const updated = await prisma.booking.update({
    where: { id: 'cmktgxivj0002e97tvadq9gff' },
    data: {
      stripeInvoiceId: 'in_1StOZCKDcy1KbOuHzlOmR5lz',
      stripeInvoicePdfUrl:
        'https://pay.stripe.com/invoice/acct_1GZPZfKDcy1KbOuH/test_YWNjdF8xR1pQWmZLRGN5MUtiT3VILF9UcjZtN0dRMW5hWkhrNXozcjh4OTlBSzVnYXZDeDhhLDE1OTg3MDE3NQ0200UTgenkVv/pdf?s=ap',
    },
  });
  console.log('Buchung aktualisiert:', updated.id);
  console.log('stripeInvoiceId:', updated.stripeInvoiceId);
  console.log('stripeInvoicePdfUrl:', updated.stripeInvoicePdfUrl);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
