# Stripe.js Load Error Troubleshooting

## Problem

When starting the development server with Next.js 16 (Turbopack), you may encounter the error:

```
Failed to load Stripe.js

at <unknown> (file:///.../chunks/node_modules_xxx._.js:...)
```

## Root Causes

1. **Missing Environment Variables**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is not set in `.env.local`
2. **Turbopack Bundling Issue**: The `loadStripe()` function from `@stripe/stripe-js` may fail during the bundling process if the publishable key is undefined
3. **Dev Server Not Restarted**: Changes to `.env.local` require a dev server restart to take effect

## Solution

### Quick Fix

1. **Verify Stripe Keys in `.env.local`**:
   ```bash
   grep "STRIPE" .env.local
   # Should output:
   # NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   # STRIPE_SECRET_KEY=sk_test_...
   ```

2. **Restart Development Server**:
   ```bash
   # Kill the current dev server
   pkill -f "next dev"
   
   # Start a fresh dev server
   npm run dev
   ```

### Implementation Details

The codebase includes protective error handling in `components/payment/StripeProvider.tsx`:

```typescript
// Safely load Stripe only if publishable key is configured
export const stripePromise =
  publishableKey && publishableKey.length > 0
    ? loadStripe(publishableKey).catch(() => {
        // Silently handle Stripe loading errors
        return null;
      })
    : null;
```

This ensures:
- ✅ Stripe is only loaded if a valid publishable key exists
- ✅ Errors during loading are gracefully caught
- ✅ The app remains functional even if Stripe loading fails
- ✅ Components can safely check `if (stripePromise)` before using Stripe

### Environment Configuration

Stripe keys are now included in the centralized environment type definitions (`lib/env.ts`):

```typescript
export type Env = {
  // ... other vars
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
};
```

## Verification

Run the quality gates to ensure everything works:

```bash
npm run typecheck  # ✅ No type errors
npm run lint       # ✅ No linting issues
npm run dev        # ✅ Dev server starts without Stripe.js errors
```

## Component Usage

Components that use Stripe should check for availability:

```tsx
import { stripePromise } from '../payment/StripeProvider';

// In JSX:
{stripePromise ? (
  <Elements stripe={stripePromise} options={{ clientSecret }}>
    <StripeCheckoutForm />
  </Elements>
) : (
  <Alert>Stripe not configured</Alert>
)}
```

The `CheckoutPageClient` component provides a full example of safe Stripe usage with fallback UI.

## Related Files

- `components/payment/StripeProvider.tsx` - Stripe initialization and error handling
- `components/checkout/CheckoutPageClient.tsx` - Safe Stripe usage pattern
- `lib/env.ts` - Centralized environment variable type definitions
- `.env.example` - Environment configuration template

## Prevention

- Always include Stripe keys in `.env.local` for development
- Restart the dev server when environment variables change
- Use the centralized `env.ts` for all environment variable access
- Implement error handling when using external scripts like Stripe

