# Agent Gamma: Service Layer Types

## Assignment Details

- **PR Number**: #3
- **Branch**: `chore/service-layer-types`
- **Priority**: Medium
- **Estimated Time**: 4-6 hours
- **Estimated Warnings Fixed**: ~30

## Objective

Add proper TypeScript types for all service layer business logic, including Stripe integration,
email services, and domain logic.

## Files to Update

### 1. lib/services/stripe.ts

**Current Issues**: Stripe SDK objects and webhooks typed as `any` **Tasks**:

- [ ] Import Stripe types from `stripe` package
- [ ] Type webhook event payloads
- [ ] Type checkout session data
- [ ] Type payment intent objects
- [ ] Type subscription data

**Example**:

```typescript
import Stripe from 'stripe';

interface CheckoutSessionParams {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  // ...
}

interface WebhookEventHandler {
  'checkout.session.completed': (session: Stripe.Checkout.Session) => Promise<void>;
  'payment_intent.succeeded': (paymentIntent: Stripe.PaymentIntent) => Promise<void>;
  'customer.subscription.updated': (subscription: Stripe.Subscription) => Promise<void>;
}

type WebhookEventType = keyof WebhookEventHandler;

export function handleWebhook(
  event: Stripe.Event,
  handlers: Partial<WebhookEventHandler>
): Promise<void> {
  const handler = handlers[event.type as WebhookEventType];
  if (handler) {
    return handler(event.data.object as any); // Type according to event type
  }
}
```

### 2. lib/services/email-service.ts

**Current Issues**: Email templates and configs use `any` **Tasks**:

- [ ] Define `EmailTemplate` interface
- [ ] Type email configuration
- [ ] Type send methods properly
- [ ] Type template variables

**Example**:

```typescript
interface EmailAddress {
  email: string;
  name?: string;
}

interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

interface EmailTemplateVariables {
  [key: string]: string | number | boolean;
}

interface SendEmailParams {
  to: EmailAddress | EmailAddress[];
  from: EmailAddress;
  subject: string;
  html: string;
  text?: string;
  replyTo?: EmailAddress;
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
}

export class EmailService {
  async sendEmail(params: SendEmailParams): Promise<{ id: string }> { ... }

  async sendTemplateEmail(
    to: EmailAddress,
    templateName: string,
    variables: EmailTemplateVariables
  ): Promise<{ id: string }> { ... }
}

// Pre-defined template types
interface WelcomeEmailVariables {
  firstName: string;
  verificationUrl: string;
}

interface BookingConfirmationVariables {
  bookingId: string;
  date: string;
  time: string;
  location: string;
}
```

### 3. lib/services/booking-service.ts

**Current Issues**: Booking DTOs and domain objects use `any` **Tasks**:

- [ ] Define `Booking` domain model
- [ ] Define `BookingStatus` enum/type
- [ ] Type service methods
- [ ] Type query parameters

**Example**:

```typescript
import { Booking as PrismaBooking, Prisma } from '@prisma/client';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

interface BookingDto {
  id: string;
  userId: string;
  serviceId: string;
  scheduledAt: Date;
  status: BookingStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface CreateBookingParams {
  userId: string;
  serviceId: string;
  scheduledAt: Date;
  notes?: string;
}

interface UpdateBookingParams {
  scheduledAt?: Date;
  status?: BookingStatus;
  notes?: string;
}

interface BookingQueryParams {
  userId?: string;
  status?: BookingStatus | BookingStatus[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class BookingService {
  async createBooking(params: CreateBookingParams): Promise<BookingDto> { ... }

  async updateBooking(
    id: string,
    params: UpdateBookingParams
  ): Promise<BookingDto> { ... }

  async findBookings(query: BookingQueryParams): Promise<BookingDto[]> { ... }

  async getBookingById(id: string): Promise<BookingDto | null> { ... }

  async cancelBooking(id: string, reason?: string): Promise<BookingDto> { ... }
}
```

### 4. lib/services/notification-service.ts

**Current Issues**: Notification payloads use `any` **Tasks**:

- [ ] Define notification types
- [ ] Type notification channels
- [ ] Type delivery status
- [ ] Type notification preferences

**Example**:

```typescript
type NotificationType = 'email' | 'sms' | 'push' | 'in_app';

interface BaseNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: Date;
}

interface EmailNotification extends BaseNotification {
  type: 'email';
  emailTemplate: string;
  variables: Record<string, string | number | boolean>;
}

interface PushNotification extends BaseNotification {
  type: 'push';
  actionUrl?: string;
  icon?: string;
}

type Notification = EmailNotification | PushNotification;

interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
}

interface DeliveryResult {
  notificationId: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
}

export class NotificationService {
  async send(notification: Notification): Promise<DeliveryResult> { ... }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> { ... }

  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> { ... }
}
```

### 5. lib/services/user-service.ts

**Current Issues**: User DTOs and profile data use `any` **Tasks**:

- [ ] Define `UserProfile` interface
- [ ] Type user update methods
- [ ] Type user query filters
- [ ] Separate public/private user data

**Example**:

```typescript
import { User as PrismaUser } from '@prisma/client';

// Public user data (safe to expose)
interface PublicUserProfile {
  id: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
}

// Full user profile (internal use)
interface UserProfile extends PublicUserProfile {
  email: string;
  emailVerified: Date | null;
  role: 'user' | 'admin';
  lastLoginAt: Date | null;
}

interface UpdateUserParams {
  name?: string;
  image?: string;
  email?: string;
}

interface UserQueryParams {
  email?: string;
  role?: 'user' | 'admin';
  emailVerified?: boolean;
  limit?: number;
  offset?: number;
}

export class UserService {
  async getUserById(id: string): Promise<UserProfile | null> { ... }

  async getPublicProfile(id: string): Promise<PublicUserProfile | null> { ... }

  async updateUser(id: string, params: UpdateUserParams): Promise<UserProfile> { ... }

  async findUsers(query: UserQueryParams): Promise<UserProfile[]> { ... }

  async deleteUser(id: string): Promise<void> { ... }
}
```

### 6. lib/services/auth-service.ts

**Current Issues**: Session and credential handling use `any` **Tasks**:

- [ ] Type session objects
- [ ] Type credential verification
- [ ] Type token generation/validation
- [ ] Type OAuth provider data

**Example**:

```typescript
import { Session } from 'next-auth';

interface Credentials {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  provider: 'google' | 'github';
}

export class AuthService {
  async verifyCredentials(credentials: Credentials): Promise<UserProfile | null> { ... }

  async generateToken(user: UserProfile): Promise<string> { ... }

  async validateToken(token: string): Promise<TokenPayload | null> { ... }

  async handleOAuthSignIn(profile: OAuthProfile): Promise<UserProfile> { ... }

  async createSession(userId: string): Promise<Session> { ... }
}
```

## Testing Requirements

### Unit Tests

- [ ] Stripe service creates checkout sessions
- [ ] Email service sends emails correctly
- [ ] Booking service CRUD operations work
- [ ] Notification service respects user preferences
- [ ] User service handles updates properly
- [ ] Auth service validates credentials

### Integration Tests

- [ ] Full booking flow (create → confirm → complete)
- [ ] Payment flow (checkout → webhook → fulfillment)
- [ ] Email delivery end-to-end
- [ ] OAuth sign-in flow

## Verification Checklist

Before creating PR:

- [ ] Run `npm run lint:ci` - verify warning reduction
- [ ] Run `npx tsc --noEmit` - ensure TypeScript compiles
- [ ] Run `npm test` - all tests pass
- [ ] Test Stripe webhook handling in dev mode
- [ ] Verify email templates render correctly
- [ ] Check booking creation/update works

## Common Patterns

### DTO Mapping

```typescript
function toDtoFromPrisma(prismaBooking: PrismaBooking): BookingDto {
  return {
    id: prismaBooking.id,
    userId: prismaBooking.userId,
    serviceId: prismaBooking.serviceId,
    scheduledAt: prismaBooking.scheduledAt,
    status: prismaBooking.status as BookingStatus,
    notes: prismaBooking.notes ?? undefined,
    metadata: (prismaBooking.metadata as Record<string, unknown>) ?? undefined,
  };
}
```

### Type Guards for Discriminated Unions

```typescript
function isEmailNotification(n: Notification): n is EmailNotification {
  return n.type === 'email';
}

function isPushNotification(n: Notification): n is PushNotification {
  return n.type === 'push';
}
```

### Safe Partial Updates

```typescript
async function updateUser(id: string, params: Partial<UpdateUserParams>): Promise<UserProfile> {
  const updateData: Prisma.UserUpdateInput = {};

  if (params.name !== undefined) updateData.name = params.name;
  if (params.email !== undefined) updateData.email = params.email;
  if (params.image !== undefined) updateData.image = params.image;

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return toUserProfile(user);
}
```

## Expected Results

**Before**: ~30 warnings in service layer **After**: 0-3 warnings (edge cases only) **Impact**:
Type-safe business logic, better IDE support, fewer runtime errors

## Resources

- [Stripe TypeScript Docs](https://stripe.com/docs/api/node)
- [Prisma Client API](https://www.prisma.io/docs/concepts/components/prisma-client)
- [NextAuth TypeScript](https://next-auth.js.org/getting-started/typescript)

## Support

If blocked or need clarification, comment on the PR or reach out to the lead developer.
