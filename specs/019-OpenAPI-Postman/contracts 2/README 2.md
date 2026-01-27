# OpenAPI Contract Fragments

This directory contains OpenAPI 3.1.0 path fragments organized by tag.
These will be consolidated into `docs/api/openapi.yaml` during implementation.

## Structure

```
contracts/
├── README.md           # This file
├── public.yaml         # Public endpoints (health, courses list)
├── auth.yaml           # Authentication providers
├── courses.yaml        # Course details and participation
├── bookings.yaml       # Booking CRUD
├── locations.yaml      # Location CRUD
├── admin.yaml          # Admin endpoints
├── webhooks.yaml       # Stripe webhook receivers
└── monitoring.yaml     # Vitals and deployment health
```

## Usage

Each file contains path definitions for a specific tag.
During the `/tasks` phase, these fragments will be merged into
the final OpenAPI specification.

## Example Fragment Structure

```yaml
# public.yaml
paths:
  /health:
    get:
      tags:
        - Public
      operationId: getHealth
      summary: Health check
      # ... rest of definition
```
