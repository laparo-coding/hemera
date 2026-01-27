# API Contract: GET /api/bookings

**Feature**: 018-user-dashboard  
**Endpoint**: `GET /api/bookings`  
**Authentication**: Required (Clerk)

## Description

Returns all bookings for the authenticated user with enhanced course details for dashboard display.

## Request

```http
GET /api/bookings HTTP/1.1
Authorization: Bearer <clerk_session_token>
```

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Clerk session token |

### Query Parameters

None

## Response

### Success (200 OK)

```typescript
interface BookingsResponse {
  success: true;
  data: {
    bookings: EnhancedBooking[];
  };
}

interface EnhancedBooking {
  // Existing fields
  id: string;
  courseId: string;
  courseTitle: string;
  coursePrice: number;      // In cents
  currency: string;         // "EUR"
  paymentStatus: PaymentStatus;
  createdAt: string;        // ISO 8601

  // NEW: Course schedule fields
  startDate: string | null;   // ISO 8601 date
  endDate: string | null;     // ISO 8601 date (null if same as startDate)
  startTime: string | null;   // ISO 8601 datetime
  endTime: string | null;     // ISO 8601 datetime

  // NEW: Location fields
  locationId: string | null;
  locationName: string | null;
  locationSlug: string | null;
  locationAddress: string | null;
  locationCity: string | null;

  // NEW: Participation status
  hasParticipation: boolean;

  // NEW: Invoice fields
  stripeInvoicePdfUrl: string | null;
}

type PaymentStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'REFUNDED' 
  | 'CONFIRMED';
```

### Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Unauthorized"
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
describe('GET /api/bookings', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const response = await fetch('/api/bookings');
    expect(response.status).toBe(401);
  });

  it('should return enhanced booking data with course details', async () => {
    // Setup: Create user with booking
    const response = await authenticatedFetch('/api/bookings');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.bookings).toBeInstanceOf(Array);
    
    if (data.data.bookings.length > 0) {
      const booking = data.data.bookings[0];
      expect(booking).toHaveProperty('startDate');
      expect(booking).toHaveProperty('endDate');
      expect(booking).toHaveProperty('startTime');
      expect(booking).toHaveProperty('endTime');
      expect(booking).toHaveProperty('locationId');
      expect(booking).toHaveProperty('locationName');
      expect(booking).toHaveProperty('locationSlug');
      expect(booking).toHaveProperty('hasParticipation');
      expect(booking).toHaveProperty('stripeInvoicePdfUrl');
    }
  });

  it('should include location data when course has location', async () => {
    // Setup: Course with location
    const response = await authenticatedFetch('/api/bookings');
    const data = await response.json();
    
    const bookingWithLocation = data.data.bookings.find(
      (b: EnhancedBooking) => b.locationId !== null
    );
    
    if (bookingWithLocation) {
      expect(bookingWithLocation.locationName).not.toBeNull();
      expect(bookingWithLocation.locationSlug).not.toBeNull();
    }
  });

  it('should set hasParticipation based on participation record', async () => {
    const response = await authenticatedFetch('/api/bookings');
    const data = await response.json();
    
    // Verify boolean type
    data.data.bookings.forEach((booking: EnhancedBooking) => {
      expect(typeof booking.hasParticipation).toBe('boolean');
    });
  });
});
```

## Implementation Notes

- Include course relation with location
- Include participation relation (select only existence check)
- Filter out CANCELLED bookings for dashboard (optional, discuss)
- Sort by startDate ascending for easier frontend categorization
