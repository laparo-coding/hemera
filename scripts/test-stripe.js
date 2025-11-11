import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config({ path: '.env.local' });

async function main() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error('STRIPE_SECRET_KEY not set');
    process.exit(1);
  }

  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
    });
    console.log('PaymentIntent created:', paymentIntent.id);
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    process.exit(1);
  }
}

main();
