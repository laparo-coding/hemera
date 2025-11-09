import Stripe from 'stripe';

const SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim();
const publishableKey =
  process.env.STRIPE_PUBLISHABLE_KEY?.trim() ??
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
const apiVersion = process.env.STRIPE_API_VERSION?.trim() ?? '2023-10-16';

function sanitizeKey(key) {
  if (!key) return 'n/a';
  const prefix = key.slice(0, 12);
  const suffix = key.slice(-4);
  return `${prefix}…${suffix}`;
}

if (!SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY ist nicht gesetzt.');
  console.error('   Bitte ergänze die Variable in deiner lokalen .env-Datei.');
  process.exit(1);
}

const stripe = new Stripe(SECRET_KEY, { apiVersion });

(async () => {
  console.log('🔐 Stripe-Key-Check gestartet');
  console.log(`   Secret Key:     ${sanitizeKey(SECRET_KEY)}`);
  console.log(
    `   Publishable Key:${publishableKey ? ` ${sanitizeKey(publishableKey)}` : ' n/a'}`
  );
  console.log(`   API Version:    ${apiVersion}`);

  try {
    const account = await stripe.accounts.retrieve();
    console.log('\n✅ Authentifizierung erfolgreich');
    console.log(`   Account ID:     ${account.id}`);
    console.log(`   Livemode:       ${account.livemode}`);
    const displayName =
      account.settings?.dashboard?.display_name ??
      account.business_profile?.name ??
      'n/a';
    console.log(`   Anzeigename:    ${displayName}`);

    const balance = await stripe.balance.retrieve();
    const available = balance.available?.[0];
    console.log('\n📊 Balance abrufbar');
    console.log(`   Währung:        ${available?.currency ?? 'n/a'}`);
    console.log(`   Betrag:         ${(available?.amount ?? 0) / 100}`);

    console.log(
      '\nAlles sieht gut aus. Die Schlüssel sind gültig und besitzen Zugriff.'
    );
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fehler bei der Stripe-Authentifizierung');
    if (error instanceof Stripe.errors.StripeError) {
      console.error(`   Typ:            ${error.type}`);
      if (error.code) console.error(`   Code:           ${error.code}`);
      if (error.message) console.error(`   Nachricht:      ${error.message}`);
      if (error.requestId)
        console.error(`   Request ID:     ${error.requestId}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
})();
