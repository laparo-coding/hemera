/**
 * Verify required environment variables for deployment
 * - Fails the build on Vercel (preview/production) if Stripe keys are missing
 */

const isVercel = process.env.VERCEL === '1';
const vercelEnv = process.env.VERCEL_ENV; // "development" | "preview" | "production"
const nodeEnv = process.env.NODE_ENV;

const envSummary = {
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: vercelEnv,
  NODE_ENV: nodeEnv,
};

function requireVar(name) {
  const v = process.env[name];
  if (!v || String(v).trim() === '') {
    return false;
  }
  return true;
}

function fail(message, details) {
  // Print a clear, actionable error and exit non-zero to fail the build
  console.error('\n❌ Environment verification failed');
  if (message) console.error(`   ${message}`);
  if (details) console.error(details);
  console.error(
    '\n💡 Fix: Set the missing variables in Vercel → Project Settings → Environment Variables'
  );
  console.error('   Required (Stripe):');
  console.error('   - STRIPE_SECRET_KEY                (Server)');
  console.error('   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (Client)');
  console.error('\nDocs: docs/ops/vercel.md');
  process.exit(1);
}

// Only enforce in Vercel preview/production builds
const enforce =
  isVercel && (vercelEnv === 'preview' || vercelEnv === 'production');

if (!enforce) {
  // Provide a short log so developers see what's happening in CI logs
  console.log(
    'ℹ️  verify-env: enforcement disabled (not a Vercel preview/production build)'
  );
  console.log(envSummary);
  process.exit(0);
}

const missing = [];
if (!requireVar('STRIPE_SECRET_KEY')) missing.push('STRIPE_SECRET_KEY');
if (!requireVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'))
  missing.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');

if (missing.length) {
  fail(
    'Missing required Stripe environment variables:',
    `   Missing: ${missing.join(', ')}`
  );
}

console.log('✅ verify-env: Required Stripe environment variables are present');
console.log(envSummary);
