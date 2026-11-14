# Tasks: Booking and Payment System

**Input**: Design documents from `/specs/004-bookings-basics/`  
**Prerequisites**: plan.md, research.md, data-model.md, contracts/api.md

Branch: `feature/004-bookings-basics`  
Scope: Complete booking and payment system with Stripe integration; Node SSR; Prisma with payment
tracking.  
Note: Tests first; respect Node runtime for Prisma/Clerk; secure payment handling.

## Execution Flow (main)

```text
1. ✅ Load plan.md - Tech stack: Next.js 14, Clerk, Stripe, Prisma, MUI
2. ✅ Load design documents:
   → data-model.md: Course, Booking, PaymentStatus entities
   → contracts/api.md: 7 API endpoints with authentication
   → research.md: Stripe integration decisions and manual retry strategy
3. ✅ Generate tasks by category: Setup, Tests, Core, Integration, Polish
4. ✅ Apply TDD rules: Tests before implementation, parallel where possible
5. ✅ Number tasks sequentially with dependencies
6. ✅ Create parallel execution examples
7. ✅ Task completeness validated
```

## Phase 3.1: Setup & Environment

- [x] T001 Environment setup: Stripe Test mode configuration  
  Files: `.env.local`  
  Configure: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- [x] T002 Prisma schema: Course and Booking models [P]  
  Files: `prisma/schema.prisma`  
  Add: Course model, Booking model, PaymentStatus enum, relations
- [x] T003 Database migration: Create booking tables [P]  
  Files: `prisma/migrations/*`  
  Run: `npx prisma db push` (schema updated successfully)
- [x] T004 Seed data: Sample courses for testing [P]  
  Files: `prisma/seed.ts`  
  Add: 5 sample courses with different prices and dates

## Phase 3.2: Tests First (TDD Required)

### Unit Tests [P] - Can run in parallel

- [x] T005 [P] Unit: Course model validations  
  Files: `tests/unit/course-model.spec.ts`  
  Test: required fields, price validation, capacity constraints
- [x] T006 [P] Unit: Booking model validations  
  Files: `tests/unit/booking-model.spec.ts`  
  Test: unique constraint, payment status validation, required fields
- [x] T007 [P] Unit: PaymentStatus enum handling  
  Files: `tests/unit/payment-status.spec.ts`  
  Test: enum values, transitions, business logic validation### API Contract Tests [P] - Can run
  in parallel

- [ ] T008 [P] Contract: POST /api/stripe/checkout  
  Files: `tests/contracts/stripe-checkout.spec.ts`  
  Test: request/response schemas, error codes, authentication
- [ ] T009 [P] Contract: POST /api/stripe/webhook  
  Files: `tests/contracts/stripe-webhook.spec.ts`  
  Test: webhook signature validation, event processing
- [ ] T010 [P] Contract: GET /api/bookings  
  Files: `tests/contracts/bookings-get.spec.ts`  
  Test: user bookings retrieval, authentication, pagination
- [ ] T011 [P] Contract: GET /api/courses  
  Files: `tests/contracts/courses-get.spec.ts`  
  Test: course listing, filtering, availability

### E2E Tests [P] - Can run in parallel

- [ ] T012 [P] E2E: Complete payment flow  
  Files: `tests/e2e/payment-complete.spec.ts`  
  Test: course selection → Stripe checkout → payment → booking confirmed
- [ ] T013 [P] E2E: Payment failure handling  
  Files: `tests/e2e/payment-failure.spec.ts`  
  Test: failed payment → error feedback → manual retry option
- [ ] T014 [P] E2E: User bookings dashboard  
  Files: `tests/e2e/bookings-dashboard.spec.ts`  
  Test: authenticated user sees bookings with payment status

## Phase 3.3: Core Implementation

### Data Layer (Sequential - Same schema file)

- [ ] T015 Prisma client: Course repository  
  Files: `lib/db/courses.ts`  
  Functions: getCourses(), getCourseById(), validateCourseExists()
- [ ] T016 Prisma client: Booking repository  
  Files: `lib/db/bookings.ts`  
  Functions: createBooking(), getUserBookings(), updatePaymentStatus()

### Stripe Integration [P] - Different service files

- [ ] T017 [P] Stripe client: Checkout session creation  
  Files: `lib/stripe/checkout.ts`  
  Functions: createCheckoutSession(), validateCourse(), handleBookingConflicts()
- [ ] T018 [P] Stripe client: Webhook processing  
  Files: `lib/stripe/webhooks.ts`  
  Functions: verifyWebhookSignature(), processPaymentEvent(), updateBookingStatus()

### API Routes [P] - Different route files

- [ ] T019 [P] API: POST /api/stripe/checkout  
  Files: `app/api/stripe/checkout/route.ts`  
  Features: authentication, validation, session creation, error handling
- [ ] T020 [P] API: POST /api/stripe/webhook  
  Files: `app/api/stripe/webhook/route.ts`  
  Features: signature verification, event processing, idempotency
- [ ] T021 [P] API: GET /api/bookings  
  Files: `app/api/bookings/route.ts`  
  Features: user authentication, booking retrieval, payment status
- [ ] T022 [P] API: GET /api/courses  
  Files: `app/api/courses/route.ts`  
  Features: course listing, availability check, pricing info

## Phase 3.4: User Interface

### UI Components [P] - Different component files

- [ ] T023 [P] UI: Course listing component  
  Files: `components/courses/CourseList.tsx`  
  Features: course cards, pricing display, "Book Now" buttons
- [ ] T024 [P] UI: Course detail component  
  Files: `components/courses/CourseDetail.tsx`  
  Features: course info, booking form, Stripe checkout integration
- [ ] T025 [P] UI: Booking status component  
  Files: `components/bookings/BookingStatus.tsx`  
  Features: payment status display, retry buttons, error messages
- [ ] T026 [P] UI: User bookings dashboard  
  Files: `components/bookings/BookingsDashboard.tsx`  
  Features: booking list, status filtering, course details

### Protected Pages [P] - Different page files

- [ ] T027 [P] Page: Course catalog  
  Files: `app/(protected)/courses/page.tsx`  
  Features: SSR course listing, search/filter, responsive design
- [ ] T028 [P] Page: Course booking  
  Files: `app/(protected)/courses/[id]/book/page.tsx`  
  Features: course details, booking form, Stripe redirect
- [ ] T029 [P] Page: User bookings  
  Files: `app/(protected)/bookings/page.tsx`  
  Features: user booking history, payment status, course links
- [ ] T030 [P] Page: Payment success  
  Files: `app/(protected)/payment/success/page.tsx`  
  Features: confirmation message, booking details, next steps
- [ ] T031 [P] Page: Payment cancel  
  Files: `app/(protected)/payment/cancel/page.tsx`  
  Features: cancellation message, retry option, course return link

## Phase 3.5: Security & Error Handling

### Validation & Security [P] - Different utility files

- [ ] T032 [P] Input validation: Request schemas  
  Files: `lib/validation/schemas.ts`  
  Features: Zod schemas, sanitization, type safety
- [ ] T033 [P] Error handling: Custom error classes  
  Files: `lib/errors/payment-errors.ts`  
  Features: PaymentError, BookingError, StripeError classes
- [ ] T034 [P] Rate limiting: Payment endpoint protection  
  Files: `middleware.ts` (extend existing)  
  Features: per-user rate limits, Stripe endpoint protection
- [ ] T035 [P] Logging: Payment flow monitoring  
  Files: `lib/logging/payment-logger.ts`  
  Features: structured logging, error tracking, audit trail

## Phase 3.6: Integration & Polish

### System Integration (Sequential - Shared configuration)

- [ ] T036 Middleware: Clerk authentication for booking routes  
  Files: `middleware.ts` (extend existing)  
  Features: protected route validation, booking access control
- [ ] T037 Database: Connection pooling optimization  
  Files: `lib/db/prisma.ts` (extend existing)  
  Features: Stripe webhook connection handling, query optimization

### Documentation & Deployment [P] - Different doc files

- [ ] T038 [P] Documentation: Stripe integration guide  
  Files: `docs/ops/stripe-integration.md`  
  Content: setup, testing, webhook handling, troubleshooting
- [ ] T039 [P] Documentation: API documentation  
  Files: `docs/api/booking-endpoints.md`  
  Content: endpoint specs, authentication, error codes
- [ ] T040 [P] Environment: Production Stripe configuration  
  Files: `.env.example`, deployment docs  
  Content: production keys setup, webhook endpoints, security notes

## Parallel Execution Examples

### Phase 3.2 - All tests can run simultaneously

```bash
# Run all unit tests in parallel
npm run test tests/unit/course-model.spec.ts &
npm run test tests/unit/booking-model.spec.ts &
npm run test tests/unit/payment-status.spec.ts &

# Run all contract tests in parallel
npm run test tests/contracts/ &

# Run all E2E tests in parallel
npm run test:e2e tests/e2e/
```

### Phase 3.3 - Core implementation groups

```bash
# Stripe services (parallel)
/task T017 & /task T018 &

# API routes (parallel)
/task T019 & /task T020 & /task T021 & /task T022 &

# Wait for completion
wait
```

### Phase 3.4 - UI implementation (all parallel)

```bash
# All UI components and pages can be built simultaneously
/task T023 & /task T024 & /task T025 & /task T026 &
/task T027 & /task T028 & /task T029 & /task T030 & /task T031 &
wait
```

## Dependencies & Critical Path

### Critical Dependencies

1. **T001-T004** (Setup) → Must complete before any implementation
2. **T002-T003** (Schema/Migration) → Required for all database operations
3. **T005-T014** (Tests) → Must pass before implementing corresponding features
4. **T015-T016** (Repositories) → Required for API routes
5. **T017-T018** (Stripe) → Required for payment routes

### Parallel Opportunities

- **Phase 3.2**: All tests can run simultaneously (11 parallel tasks)
- **Phase 3.3**: Stripe services and API routes (6 parallel tasks)
- **Phase 3.4**: All UI components and pages (9 parallel tasks)
- **Phase 3.5**: All security utilities (4 parallel tasks)

## Done Criteria

- Complete booking and payment system functional end-to-end for signed-in users
- Stripe Checkout integration working with payment confirmation via webhooks
- Course catalog available; users can book and pay for courses
- Booking status tracking (pending, confirmed, failed, cancelled)
- Webhook handling for secure payment processing with signature validation
- Error handling for payment failures and booking conflicts with manual retry
- Rate limiting and security measures for payment endpoints
- Comprehensive test coverage: unit, contract, and E2E tests passing
- Documentation complete for setup, API usage, and troubleshooting
- Production-ready Stripe configuration documented and testable
