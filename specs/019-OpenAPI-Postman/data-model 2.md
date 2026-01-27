# Data Model: OpenAPI 3.1 & Postman Collection

**Feature Branch**: `017-OpenAPI-Postman`  
**Date**: 2026-01-04

---

## Overview

This document defines the reusable OpenAPI component schemas for the Hemera API specification.
All schemas follow OpenAPI 3.1.0 / JSON Schema draft 2020-12 conventions.

---

## Core Response Schemas

### StandardResponse

Wrapper for all successful API responses.

```yaml
StandardResponse:
  type: object
  properties:
    success:
      type: boolean
      const: true
    data:
      description: Response payload (varies by endpoint)
    requestId:
      type: string
      format: uuid
      description: Unique request identifier for debugging
  required:
    - success
    - requestId
```

### ErrorResponse

Wrapper for all error responses.

```yaml
ErrorResponse:
  type: object
  properties:
    success:
      type: boolean
      const: false
    error:
      type: string
      description: Human-readable error message
    code:
      type: string
      enum:
        - VALIDATION_ERROR
        - UNAUTHORIZED
        - FORBIDDEN
        - NOT_FOUND
        - CONFLICT
        - RATE_LIMITED
        - STRIPE_ERROR
        - INTERNAL_ERROR
      description: Machine-readable error code
    requestId:
      type: string
      format: uuid
  required:
    - success
    - error
    - code
    - requestId
```

---

## Entity Schemas

### Course

```yaml
Course:
  type: object
  properties:
    id:
      type: string
      format: cuid
      description: Unique course identifier
    title:
      type: string
      maxLength: 200
    slug:
      type: string
      pattern: ^[a-z0-9-]+$
    description:
      type: string
    price:
      type: integer
      minimum: 0
      description: Price in cents (EUR)
    currency:
      type: string
      enum: [EUR]
      default: EUR
    startDate:
      type: string
      format: date-time
    endDate:
      type: string
      format: date-time
    locationId:
      type: string
      format: cuid
      nullable: true
    maxParticipants:
      type: integer
      minimum: 1
    isPublished:
      type: boolean
    thumbnailUrl:
      type: string
      format: uri
      nullable: true
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
  required:
    - id
    - title
    - slug
    - price
    - currency
    - startDate
    - isPublished
```

### CourseSummary

Lightweight course representation for listings.

```yaml
CourseSummary:
  type: object
  properties:
    id:
      type: string
      format: cuid
    title:
      type: string
    slug:
      type: string
    price:
      type: integer
    currency:
      type: string
    startDate:
      type: string
      format: date-time
    thumbnailUrl:
      type: string
      format: uri
      nullable: true
    location:
      $ref: '#/components/schemas/LocationSummary'
  required:
    - id
    - title
    - slug
    - price
    - startDate
```

### Booking

```yaml
Booking:
  type: object
  properties:
    id:
      type: string
      format: cuid
    userId:
      type: string
      description: Clerk user ID
    courseId:
      type: string
      format: cuid
    status:
      type: string
      enum:
        - PENDING
        - CONFIRMED
        - CANCELLED
        - COMPLETED
    paymentIntentId:
      type: string
      nullable: true
    stripeSessionId:
      type: string
      nullable: true
    amount:
      type: integer
      description: Amount paid in cents
    currency:
      type: string
      enum: [EUR]
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
    course:
      $ref: '#/components/schemas/CourseSummary'
  required:
    - id
    - userId
    - courseId
    - status
    - createdAt
```

### Location

```yaml
Location:
  type: object
  properties:
    id:
      type: string
      format: cuid
    name:
      type: string
      maxLength: 200
    slug:
      type: string
      pattern: ^[a-z0-9-]+$
    address:
      type: string
    city:
      type: string
    postalCode:
      type: string
    country:
      type: string
      default: DE
    latitude:
      type: number
      format: double
      nullable: true
    longitude:
      type: number
      format: double
      nullable: true
    imageUrl:
      type: string
      format: uri
      nullable: true
    description:
      type: string
      nullable: true
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
  required:
    - id
    - name
    - slug
    - address
    - city
    - country
```

### LocationSummary

```yaml
LocationSummary:
  type: object
  properties:
    id:
      type: string
      format: cuid
    name:
      type: string
    slug:
      type: string
    city:
      type: string
  required:
    - id
    - name
    - city
```

### User

```yaml
User:
  type: object
  properties:
    id:
      type: string
      format: cuid
    clerkId:
      type: string
      description: Clerk user ID
    email:
      type: string
      format: email
    firstName:
      type: string
      nullable: true
    lastName:
      type: string
      nullable: true
    role:
      type: string
      enum:
        - USER
        - ADMIN
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
  required:
    - id
    - clerkId
    - email
    - role
```

### UserProfile

```yaml
UserProfile:
  type: object
  properties:
    id:
      type: string
    email:
      type: string
      format: email
    firstName:
      type: string
      nullable: true
    lastName:
      type: string
      nullable: true
    imageUrl:
      type: string
      format: uri
      nullable: true
  required:
    - id
    - email
```

---

## Course Participation Schemas

### PreparationPhase

```yaml
PreparationPhase:
  type: object
  properties:
    bookingId:
      type: string
      format: cuid
    status:
      type: string
      enum: [NOT_STARTED, IN_PROGRESS, COMPLETED]
    completedAt:
      type: string
      format: date-time
      nullable: true
    data:
      type: object
      additionalProperties: true
  required:
    - bookingId
    - status
```

### SummaryPhase

```yaml
SummaryPhase:
  type: object
  properties:
    bookingId:
      type: string
      format: cuid
    status:
      type: string
      enum: [NOT_STARTED, IN_PROGRESS, COMPLETED]
    videoUrl:
      type: string
      format: uri
      nullable: true
    notes:
      type: string
      nullable: true
  required:
    - bookingId
    - status
```

### DebriefingPhase

```yaml
DebriefingPhase:
  type: object
  properties:
    bookingId:
      type: string
      format: cuid
    status:
      type: string
      enum: [NOT_STARTED, IN_PROGRESS, COMPLETED]
    feedback:
      type: string
      nullable: true
    rating:
      type: integer
      minimum: 1
      maximum: 5
      nullable: true
  required:
    - bookingId
    - status
```

### ResultPhase

```yaml
ResultPhase:
  type: object
  properties:
    bookingId:
      type: string
      format: cuid
    status:
      type: string
      enum: [NOT_STARTED, IN_PROGRESS, COMPLETED]
    certificateUrl:
      type: string
      format: uri
      nullable: true
    score:
      type: number
      nullable: true
  required:
    - bookingId
    - status
```

---

## Payment Schemas

### PaymentIntent

```yaml
PaymentIntent:
  type: object
  properties:
    clientSecret:
      type: string
      description: Stripe client secret for frontend
    paymentIntentId:
      type: string
    amount:
      type: integer
      description: Amount in cents
    currency:
      type: string
      enum: [eur]
  required:
    - clientSecret
    - paymentIntentId
    - amount
    - currency
```

### CheckoutSession

```yaml
CheckoutSession:
  type: object
  properties:
    sessionId:
      type: string
    url:
      type: string
      format: uri
      description: Stripe Checkout redirect URL
  required:
    - sessionId
    - url
```

---

## Utility Schemas

### Pagination

```yaml
Pagination:
  type: object
  properties:
    page:
      type: integer
      minimum: 1
    limit:
      type: integer
      minimum: 1
      maximum: 100
    total:
      type: integer
    totalPages:
      type: integer
  required:
    - page
    - limit
    - total
    - totalPages
```

### HealthCheck

```yaml
HealthCheck:
  type: object
  properties:
    status:
      type: string
      enum: [healthy, degraded, unhealthy]
    version:
      type: string
    timestamp:
      type: string
      format: date-time
    database:
      type: string
      enum: [connected, disconnected]
  required:
    - status
    - timestamp
```

---

## Security Schemes

### ClerkBearerAuth

```yaml
securitySchemes:
  clerkAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
    description: |
      Clerk JWT token obtained from Clerk authentication.
      
      To obtain a token:
      1. Sign in via the Hemera web application
      2. Open browser DevTools → Application → Cookies
      3. Copy the `__session` cookie value
      
      Or use Clerk's `getToken()` method in frontend code.
```

---

## Tag Definitions

```yaml
tags:
  - name: Public
    description: Publicly accessible endpoints (no authentication required)
  - name: Auth
    description: Authentication provider information
  - name: Courses
    description: Course information and listings
  - name: Bookings
    description: Course booking management
  - name: Locations
    description: Training location management
  - name: Admin
    description: Administrative endpoints (admin role required)
  - name: Webhooks
    description: External service webhook receivers
  - name: Monitoring
    description: Application health and monitoring
```

---

## Server Configuration

```yaml
servers:
  - url: http://localhost:3000/api
    description: Local Development
  - url: https://staging.hemera.app/api
    description: Staging Environment
  - url: https://hemera.app/api
    description: Production
```
