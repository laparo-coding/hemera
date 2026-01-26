# Feature Specification: OpenAPI 3.1 & Postman Collection

**Feature Branch**: `019-OpenAPI-Postman`  
**Created**: 2025-01-04  
**Status**: Draft  
**Input**: User description: "Create a complete, consolidated OpenAPI 3.1.0 specification and a Postman Collection that documents all API endpoints of the Hemera project and makes them importable into Postman."

---

## Clarifications

### Session 2026-01-04

- Q: Wie sollen deprecated Endpoints dokumentiert werden, die noch funktional sind? → A: `deprecated: true` Flag + Sunset-Header-Dokumentation (OpenAPI-Standard-konform, mit Migrationshinweis in Description)
- Q: Wie sollen Rate-Limited Endpoints dokumentiert werden? → A: Kombination aus Description (Limit-Info) + 429-Response-Schema mit `Retry-After` Header
- Q: Wie sollen Webhook-Endpoints dargestellt werden? → A: Als reguläre POST-Endpoints unter `/webhooks/*` (Hemera empfängt Webhooks, sendet keine)
- Q: Wie mit unterschiedlichen Schemas zwischen Environments umgehen? → A: Server-Array mit Environment-URLs, identische Schemas; experimentelle Endpoints mit `x-internal: true` markieren

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As a developer or API consumer, I want a consolidated OpenAPI specification and Postman collection for all Hemera API endpoints, so that I can explore, test, and integrate with the API efficiently without reading source code.

### Acceptance Scenarios

1. **Given** the OpenAPI specification file exists, **When** I open it in an OpenAPI viewer or import it into Postman, **Then** I see all API endpoints organized by logical groups (Public, Authenticated, Admin, Webhooks) with complete request/response schemas.

2. **Given** I import the Postman collection, **When** I configure the environment variables (base URL, auth token), **Then** I can execute any API request and receive valid responses matching the documented schemas.

3. **Given** an authenticated endpoint requires a Clerk JWT token, **When** I set the `clerkToken` environment variable in Postman, **Then** the pre-request script automatically adds the Authorization header and the request succeeds.

4. **Given** I want to test an admin-only endpoint, **When** I use the admin token environment variable, **Then** the request includes proper admin authorization and returns appropriate data.

5. **Given** the API specification is validated, **When** I run the linting tool against it, **Then** no errors are reported and the specification conforms to OpenAPI 3.1.0 standards.

### Edge Cases

- **Deprecated Endpoints**: Verwenden `deprecated: true` Flag gemäß OpenAPI 3.1 + Sunset-Header-Datum in Description mit Migrationshinweis auf neuen Endpoint.
- **Rate-Limited Endpoints**: Dokumentation via Description (z.B. "100 req/min") + 429-Response-Schema mit `Retry-After` Header.
- **Webhook-Endpoints**: Als reguläre POST-Endpoints unter `/api/webhooks/*` dokumentieren mit `Webhooks`-Tag; Signatur-Validierung statt Bearer Token.
- **Environment-Schemas**: Identische Schemas für alle Environments; nur Server-URLs unterscheiden sich. Experimentelle dev-only Endpoints mit `x-internal: true` markieren.

---

## Requirements _(mandatory)_

### Functional Requirements

#### OpenAPI Specification

- **FR-001**: System MUST provide a consolidated OpenAPI 3.1.0 specification documenting all API endpoints from the Hemera project in a single file.

- **FR-002**: System MUST organize endpoints by logical tags: Public, Auth, Bookings, Courses, Locations, Admin, Webhooks, and Monitoring.

- **FR-003**: System MUST document all public endpoints including:
  - Health check endpoints
  - Course listing and details
  - Location listing and details
  - Authentication provider information

- **FR-004**: System MUST document all authenticated user endpoints including:
  - Booking creation and retrieval
  - Checkout and payment flow
  - Course participation phases (preparation, summary, debriefing, result)
  - User profile management

- **FR-005**: System MUST document all admin-only endpoints including:
  - Course management (CRUD operations)
  - User management
  - Analytics and error logs
  - Location management
  - File uploads

- **FR-006**: System MUST document webhook endpoints for external service integrations.

- **FR-007**: System MUST define all request/response schemas in a reusable components section, including standard success and error response formats.

- **FR-008**: System MUST document the authentication mechanism (Bearer token via Clerk JWT) in the security schemes section.

- **FR-009**: System MUST include example request and response payloads for common use cases.

- **FR-010**: System MUST document path parameters, query parameters, and request body schemas with appropriate data types, formats, and validation constraints.

#### Postman Collection

- **FR-011**: System MUST provide a Postman collection file that can be directly imported containing all documented endpoints.

- **FR-012**: System MUST organize Postman requests into folders matching the OpenAPI tag structure.

- **FR-013**: System MUST include pre-request scripts for automatic authentication header injection.

- **FR-014**: System MUST include basic test scripts validating successful response status codes.

- **FR-015**: System MUST provide a Postman environment template with configurable variables for base URL, authentication tokens, and common test data identifiers.

#### Documentation & Validation

- **FR-016**: System MUST provide a README with step-by-step import instructions, environment setup guide, and troubleshooting tips.

- **FR-017**: System MUST pass OpenAPI linting validation with no errors.

- **FR-018**: System MUST document the standard response format including `success`, `data`, `error`, `code`, and `requestId` fields.

### Key Entities

- **OpenAPI Specification Document**: YAML file conforming to OpenAPI 3.1.0 standard, containing paths, schemas, security definitions, and server configurations for all Hemera API endpoints.

- **Postman Collection**: JSON file in Postman Collection v2.1 format, containing organized request folders, authentication helpers, and test scripts.

- **Postman Environment**: JSON file defining environment variables for API base URL, authentication tokens, and reusable test data identifiers.

- **Import Guide**: Documentation explaining how to import and configure the collection, obtain authentication tokens, and execute common API workflows.

---

## Dependencies

- Existing API routes under `/app/api/` serve as the source of truth for endpoint definitions
- Clerk authentication system for JWT token documentation
- Existing OpenAPI fragments in various spec directories may be consolidated
- Spectral linting configuration for validation

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
