# Agent Delta: Component & Auth Types

## Assignment Details

- **PR Number**: #4
- **Branch**: `chore/component-types`
- **Priority**: Medium
- **Estimated Time**: 3-5 hours
- **Estimated Warnings Fixed**: ~25

## Objective

Add proper TypeScript types for React components, authentication UI, and payment components.

## Files to Update

### 1. components/auth/SignInForm.tsx

**Current Issues**: Form handlers and auth callbacks use `any` **Tasks**:

- [ ] Type all component props
- [ ] Type form state
- [ ] Type event handlers
- [ ] Type auth provider data

**Example**:

```typescript
import { signIn } from 'next-auth/react';
import { BuiltInProviderType } from 'next-auth/providers';

interface SignInFormProps {
  callbackUrl?: string;
  error?: string;
  providers?: Record<string, ClientSafeProvider>;
}

interface SignInFormState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}

interface ClientSafeProvider {
  id: BuiltInProviderType;
  name: string;
  type: 'oauth' | 'email' | 'credentials';
  signinUrl: string;
  callbackUrl: string;
}

export default function SignInForm({
  callbackUrl = '/',
  error,
  providers = {},
}: SignInFormProps) {
  const [formState, setFormState] = useState<SignInFormState>({ ... });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // ...
  };

  const handleOAuthSignIn = async (providerId: BuiltInProviderType) => {
    await signIn(providerId, { callbackUrl });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

### 2. components/auth/VerificationRequest.tsx

**Current Issues**: Verification data and callbacks use `any` **Tasks**:

- [ ] Type component props
- [ ] Type verification state
- [ ] Type resend handler

**Example**:

```typescript
interface VerificationRequestProps {
  email: string;
  onResend?: (email: string) => Promise<void>;
}

interface VerificationState {
  status: 'pending' | 'sending' | 'sent' | 'error';
  message: string | null;
  canResend: boolean;
  countdown: number;
}

export default function VerificationRequest({
  email,
  onResend,
}: VerificationRequestProps) {
  const [state, setState] = useState<VerificationState>({ ... });

  const handleResend = async () => {
    if (!state.canResend) return;

    setState(prev => ({ ...prev, status: 'sending' }));

    try {
      await onResend?.(email);
      setState({
        status: 'sent',
        message: 'Email sent successfully',
        canResend: false,
        countdown: 60,
      });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to send email',
        canResend: true,
        countdown: 0,
      });
    }
  };

  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### 3. components/payment/StripeCheckoutForm.tsx (already partially fixed)

**Current Issues**: Remaining `any` in Stripe elements config **Tasks**:

- [ ] Type Stripe elements appearance
- [ ] Type payment method options
- [ ] Type setup intent options
- [ ] Ensure all callbacks are typed

**Example**:

```typescript
import { Stripe, StripeElements, PaymentIntent } from '@stripe/stripe-js';
import { Appearance } from '@stripe/stripe-js';

interface StripeCheckoutFormProps {
  clientSecret: string;
  onSuccess: (paymentIntent: PaymentIntent) => void;
  onError: (error: Error) => void;
  amount: number;
  currency: string;
}

interface FormState {
  isProcessing: boolean;
  errorMessage: string | null;
}

const stripeAppearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0070f3',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#df1b41',
    fontFamily: 'system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '4px',
  },
};

export default function StripeCheckoutForm({
  clientSecret,
  onSuccess,
  onError,
  amount,
  currency,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [formState, setFormState] = useState<FormState>({ ... });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setFormState({ isProcessing: true, errorMessage: null });

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/payment/success',
      },
      redirect: 'if_required',
    });

    if (error) {
      setFormState({
        isProcessing: false,
        errorMessage: error.message ?? 'Payment failed',
      });
      onError(new Error(error.message));
    } else if (paymentIntent) {
      setFormState({ isProcessing: false, errorMessage: null });
      onSuccess(paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

### 4. components/payment/PaymentHistory.tsx

**Current Issues**: Payment records use `any` **Tasks**:

- [ ] Define `PaymentRecord` interface
- [ ] Type component props
- [ ] Type filter/sort state
- [ ] Type pagination

**Example**:

```typescript
interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  createdAt: Date;
  description?: string;
  receiptUrl?: string;
}

interface PaymentHistoryProps {
  userId: string;
  initialRecords?: PaymentRecord[];
}

interface PaymentHistoryState {
  records: PaymentRecord[];
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
  statusFilter: PaymentRecord['status'] | 'all';
}

export default function PaymentHistory({
  userId,
  initialRecords = [],
}: PaymentHistoryProps) {
  const [state, setState] = useState<PaymentHistoryState>({ ... });

  const fetchPayments = async () => {
    // Typed fetch logic
  };

  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### 5. components/booking/BookingForm.tsx

**Current Issues**: Booking form data and validation use `any` **Tasks**:

- [ ] Type form fields
- [ ] Type validation errors
- [ ] Type submission handler
- [ ] Type availability data

**Example**:

```typescript
interface BookingFormData {
  serviceId: string;
  date: Date;
  time: string;
  notes: string;
}

interface BookingFormErrors {
  serviceId?: string;
  date?: string;
  time?: string;
  notes?: string;
  general?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface BookingFormProps {
  services: Array<{ id: string; name: string; duration: number }>;
  onSubmit: (data: BookingFormData) => Promise<void>;
  availability?: TimeSlot[];
}

interface BookingFormState {
  formData: BookingFormData;
  errors: BookingFormErrors;
  isSubmitting: boolean;
  availableSlots: TimeSlot[];
}

export default function BookingForm({
  services,
  onSubmit,
  availability = [],
}: BookingFormProps) {
  const [state, setState] = useState<BookingFormState>({ ... });

  const validateForm = (): boolean => {
    const errors: BookingFormErrors = {};

    if (!state.formData.serviceId) {
      errors.serviceId = 'Please select a service';
    }
    if (!state.formData.date) {
      errors.date = 'Please select a date';
    }
    if (!state.formData.time) {
      errors.time = 'Please select a time';
    }

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      await onSubmit(state.formData);
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: {
          general: error instanceof Error ? error.message : 'Booking failed',
        },
      }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

### 6. components/dashboard/UserDashboard.tsx

**Current Issues**: Dashboard data and widgets use `any` **Tasks**:

- [ ] Type dashboard props
- [ ] Type widget data
- [ ] Type user stats
- [ ] Type action handlers

**Example**:

```typescript
interface UserStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  totalSpent: number;
}

interface DashboardWidget {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
}

interface UserDashboardProps {
  userId: string;
  stats?: UserStats;
  recentBookings?: BookingRecord[];
}

interface DashboardState {
  stats: UserStats | null;
  widgets: DashboardWidget[];
  isLoading: boolean;
  error: string | null;
}

export default function UserDashboard({
  userId,
  stats,
  recentBookings = [],
}: UserDashboardProps) {
  const [state, setState] = useState<DashboardState>({ ... });

  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### 7. app/auth/error/page.tsx

**Current Issues**: Error page params use `any` **Tasks**:

- [ ] Type Next.js page props
- [ ] Type error codes
- [ ] Type error messages

**Example**:

```typescript
type AuthErrorCode =
  | 'Configuration'
  | 'AccessDenied'
  | 'Verification'
  | 'OAuthSignin'
  | 'OAuthCallback'
  | 'OAuthCreateAccount'
  | 'EmailCreateAccount'
  | 'Callback'
  | 'OAuthAccountNotLinked'
  | 'EmailSignin'
  | 'CredentialsSignin'
  | 'SessionRequired'
  | 'Default';

interface AuthErrorPageProps {
  searchParams: {
    error?: AuthErrorCode;
  };
}

const errorMessages: Record<AuthErrorCode, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access denied. You do not have permission.',
  Verification: 'The verification link is invalid or has expired.',
  OAuthSignin: 'Error signing in with OAuth provider.',
  OAuthCallback: 'Error during OAuth callback.',
  OAuthCreateAccount: 'Could not create OAuth account.',
  EmailCreateAccount: 'Could not create email account.',
  Callback: 'Error during callback.',
  OAuthAccountNotLinked: 'This account is linked to another provider.',
  EmailSignin: 'Check your email for the sign in link.',
  CredentialsSignin: 'Invalid credentials.',
  SessionRequired: 'Please sign in to access this page.',
  Default: 'An unexpected error occurred.',
};

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const error = searchParams.error || 'Default';
  const message = errorMessages[error];

  return (
    <div>
      <h1>Authentication Error</h1>
      <p>{message}</p>
    </div>
  );
}
```

## Testing Requirements

### Component Tests

- [ ] SignInForm renders correctly
- [ ] SignInForm handles form submission
- [ ] StripeCheckoutForm processes payments
- [ ] BookingForm validates input
- [ ] PaymentHistory displays records
- [ ] UserDashboard shows stats

### Integration Tests

- [ ] Full auth flow (sign in → verify → redirect)
- [ ] Payment flow (form → Stripe → success)
- [ ] Booking flow (form → submit → confirmation)

## Verification Checklist

Before creating PR:

- [ ] Run `npm run lint:ci` - verify warning reduction
- [ ] Run `npx tsc --noEmit` - ensure TypeScript compiles
- [ ] Run `npm test` - all tests pass
- [ ] Test sign-in flow in dev mode
- [ ] Test payment form (use Stripe test mode)
- [ ] Verify booking form validation

## Common Patterns

### Controlled Form Inputs

```typescript
const [formData, setFormData] = useState<FormData>({ ... });

const handleChange = (field: keyof FormData) => (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  setFormData(prev => ({ ...prev, [field]: e.target.value }));
};

<input
  value={formData.email}
  onChange={handleChange('email')}
/>
```

### Type-Safe Event Handlers

```typescript
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  // ...
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};
```

### Async State Management

```typescript
const [state, setState] = useState<State>({ ... });

const fetchData = async () => {
  setState(prev => ({ ...prev, isLoading: true }));

  try {
    const data = await apiCall();
    setState({ data, isLoading: false, error: null });
  } catch (error) {
    setState({
      data: null,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
```

## Expected Results

**Before**: ~25 warnings in components/auth **After**: 0-2 warnings (edge cases only) **Impact**:
Type-safe UI components, better form validation, fewer runtime errors

## Resources

- [NextAuth TypeScript](https://next-auth.js.org/getting-started/typescript)
- [Stripe React TypeScript](https://stripe.com/docs/stripe-js/react)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## Support

If blocked or need clarification, comment on the PR or reach out to the lead developer.
