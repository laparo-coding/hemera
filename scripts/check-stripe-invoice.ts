import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover' as Stripe.LatestApiVersion,
});

async function main() {
  try {
    // Test invoice creation flow
    const customerEmail = 'a.berntbaertl@googlemail.com';
    const courseName = 'Test Kurs';
    const amount = 30000;
    const currency = 'eur';

    console.log('1. Finding/creating customer...');
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('   Found existing customer:', customerId);
    } else {
      const customer = await stripe.customers.create({
        email: customerEmail,
      });
      customerId = customer.id;
      console.log('   Created new customer:', customerId);
    }

    console.log('2. Creating invoice item...');
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: amount,
      currency: currency,
      description: `Kursbuchung: ${courseName}`,
    });
    console.log('   Invoice item created:', invoiceItem.id);

    console.log('3. Creating invoice...');
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: false, // Don't auto-finalize
      collection_method: 'send_invoice',
      days_until_due: 0,
    });
    console.log('   Invoice created:', invoice.id);

    console.log('4. Finalizing invoice...');
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log('   Invoice finalized:', finalizedInvoice.status);

    console.log('5. Marking as paid out of band...');
    if (finalizedInvoice.status !== 'paid') {
      const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id, {
        paid_out_of_band: true,
      });
      console.log('   Invoice paid:', paidInvoice.status);
      console.log('   Invoice PDF:', paidInvoice.invoice_pdf);
      console.log('\n✅ Success! Invoice ID:', paidInvoice.id);
    } else {
      console.log('   Invoice already paid');
      console.log('   Invoice PDF:', finalizedInvoice.invoice_pdf);
      console.log('\n✅ Success! Invoice ID:', finalizedInvoice.id);
    }
  } catch (error) {
    const stripeError = error as {
      message?: string;
      type?: string;
      code?: string;
    };
    console.error('❌ Error:', {
      message: stripeError.message,
      type: stripeError.type,
      code: stripeError.code,
    });
  }
}

main();
