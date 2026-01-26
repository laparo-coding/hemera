# API Contract: GET /api/bookings/[bookingId]/invoice

**Feature**: 018-user-dashboard  
**Endpoint**: `GET /api/bookings/:bookingId/invoice`  
**Authentication**: Required (Clerk)

## Description

Downloads the Stripe invoice PDF for a specific booking. Redirects to the Stripe-hosted PDF URL.

## Request

```http
GET /api/bookings/{bookingId}/invoice HTTP/1.1
Authorization: Bearer <clerk_session_token>
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| bookingId | string | Yes | The booking's unique ID (cuid) |

## Response

### Success (302 Found)

Redirects to Stripe-hosted invoice PDF URL.

```http
HTTP/1.1 302 Found
Location: https://invoice.stripe.com/invoice/acct_xxx/xxx/pdf
```

### Error Responses

**401 Unauthorized** - User not authenticated
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**403 Forbidden** - User does not own this booking
```json
{
  "success": false,
  "error": "Forbidden"
}
```

**404 Not Found** - Booking not found
```json
{
  "success": false,
  "error": "Booking not found"
}
```

**404 Not Found** - Invoice not available
```json
{
  "success": false,
  "error": "Invoice not available"
}
```

**400 Bad Request** - Booking not paid
```json
{
  "success": false,
  "error": "Invoice only available for paid bookings"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Contract Tests

```typescript
describe('GET /api/bookings/[bookingId]/invoice', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const response = await fetch('/api/bookings/test-id/invoice');
    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent booking', async () => {
    const response = await authenticatedFetch(
      '/api/bookings/non-existent-id/invoice'
    );
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Booking not found');
  });

  it('should return 403 when accessing another user booking', async () => {
    // Setup: Create booking for different user
    const response = await authenticatedFetch(
      `/api/bookings/${otherUserBookingId}/invoice`
    );
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('should return 400 for unpaid booking', async () => {
    // Setup: Create PENDING booking
    const response = await authenticatedFetch(
      `/api/bookings/${pendingBookingId}/invoice`
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invoice only available for paid bookings');
  });

  it('should return 404 when invoice not available', async () => {
    // Setup: PAID booking without stripeInvoicePdfUrl
    const response = await authenticatedFetch(
      `/api/bookings/${paidBookingNoInvoiceId}/invoice`
    );
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Invoice not available');
  });

  it('should redirect to Stripe PDF for valid paid booking', async () => {
    // Setup: PAID booking with stripeInvoicePdfUrl
    const response = await authenticatedFetch(
      `/api/bookings/${paidBookingWithInvoiceId}/invoice`,
      { redirect: 'manual' }
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toMatch(
      /^https:\/\/.*stripe.*\.pdf/
    );
  });
});
```

## Security Considerations

1. **Authorization**: User can only access their own booking's invoice
2. **Payment Status**: Only PAID or CONFIRMED bookings have invoices
3. **Rate Limiting**: Consider rate limiting to prevent abuse
4. **Logging**: Log all invoice access attempts to Rollbar

## Implementation Notes

```typescript
// Pseudo-implementation
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) return unauthorized();

  // 2. Fetch booking
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: {
      id: true,
      userId: true,
      paymentStatus: true,
      stripeInvoicePdfUrl: true,
      stripeInvoiceId: true,
    },
  });

  if (!booking) return notFound('Booking not found');

  // 3. Authorization check
  if (booking.userId !== userId) return forbidden();

  // 4. Payment status check
  if (booking.paymentStatus !== 'PAID' && booking.paymentStatus !== 'CONFIRMED') {
    return badRequest('Invoice only available for paid bookings');
  }

  // 5. Get invoice URL (from DB or fetch from Stripe)
  let pdfUrl = booking.stripeInvoicePdfUrl;
  
  if (!pdfUrl && booking.stripeInvoiceId) {
    pdfUrl = await getInvoicePdfUrl(booking.stripeInvoiceId);
    // Cache for future requests
    if (pdfUrl) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { stripeInvoicePdfUrl: pdfUrl },
      });
    }
  }

  if (!pdfUrl) return notFound('Invoice not available');

  // 6. Redirect to PDF
  return NextResponse.redirect(pdfUrl);
}
```
