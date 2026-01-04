# Postman API Import - Executable Prompt

## Context

The Hemera project is a Next.js application with an extensive REST API. Several OpenAPI specifications already exist in various spec directories, but there is no consolidated specification for importing into Postman.

## Goal

Create a complete, consolidated OpenAPI 3.1.0 specification and a Postman Collection that documents all API endpoints of the Hemera project and makes them importable into Postman.

## Executable Prompt for Code Mode

```
Create a consolidated OpenAPI 3.1.0 specification and Postman documentation for the Hemera project:

1. **Create OpenAPI Specification** (`specs/postman/hemera-api.yaml`):
   - Consolidate all API endpoints from app/api/
   - Use OpenAPI 3.1.0 format
   - Group endpoints by tags (Public, Auth, Admin, Bookings, Locations, etc.)
   - Define all schemas in components/schemas
   - Document Clerk JWT Authentication in components/securitySchemes
   - Add example requests and responses
   
   **API Endpoints to Document:**
   
   **Public Endpoints:**
   - GET /api/health - Health Check
   - GET /api/health/deployment - Deployment Health
   - GET /api/auth/providers - Auth Provider List
   - GET /api/courses - Course List (with filtering, pagination)
   - GET /api/courses/{id} - Course Details
   - GET /api/courses/next - Next Course
   - GET /api/locations - Location List
   - GET /api/locations/{id} - Location Details
   - GET /api/locations/by-slug/{slug} - Location by Slug
   
   **Authenticated Endpoints:**
   - GET /api/bookings - User's Bookings
   - POST /api/bookings - Create New Booking
   - POST /api/checkout - Initiate Checkout
   - POST /api/checkout/verify - Verify Checkout
   - POST /api/payment/create-intent - Create Payment Intent
   - POST /api/payment/confirm - Confirm Payment
   - GET /api/my-courses/{bookingId}/preparation - Course Preparation
   - GET /api/my-courses/{bookingId}/summary - Course Summary
   - GET /api/my-courses/{bookingId}/debriefing - Course Debriefing
   - GET /api/my-courses/{bookingId}/result - Course Result
   - POST /api/my-courses/{bookingId}/resume - Resume Course
   - GET /api/users/profile - User Profile
   
   **Admin Endpoints:**
   - GET /api/admin/courses - All Courses (Admin)
   - POST /api/admin/courses - Create Course
   - GET /api/admin/courses/{id} - Get Course
   - PUT /api/admin/courses/{id} - Update Course
   - DELETE /api/admin/courses/{id} - Delete Course
   - POST /api/admin/courses/{id}/transfer-enrollments - Transfer Enrollments
   - GET /api/admin/users - User List
   - GET /api/admin/analytics - Analytics Data
   - GET /api/admin/errors - Error Log
   - POST /api/locations - Create Location (Admin)
   - PUT /api/locations/{id} - Update Location (Admin)
   - POST /api/locations/geocode - Geocode Address (Admin)
   - POST /api/upload/thumbnail - Upload Thumbnail (Admin)
   - POST /api/upload/location-image - Upload Location Image (Admin)
   
   **Webhook Endpoints:**
   - POST /api/webhooks/stripe - Stripe Webhook
   - POST /api/stripe/webhook - Stripe Webhook (legacy)
   
   **Monitoring:**
   - POST /api/monitoring/vitals - Web Vitals

2. **Validate the Specification:**
   - Run `npx @stoplight/spectral-cli lint specs/postman/hemera-api.yaml`
   - Fix all errors and warnings

3. **Create Postman Environment** (`specs/postman/hemera-environment.json`):
   ```json
   {
     "name": "Hemera Local",
     "values": [
       {
         "key": "baseUrl",
         "value": "http://localhost:3000",
         "enabled": true
       },
       {
         "key": "clerkToken",
         "value": "",
         "enabled": true
       },
       {
         "key": "adminToken",
         "value": "",
         "enabled": true
       }
     ]
   }
   ```

4. **Create Import Guide** (`specs/postman/README.md`):
   - Step-by-step guide for Postman import
   - Explanation of environment variables
   - Instructions for obtaining Clerk JWT Token
   - Examples for common API calls
   - Troubleshooting tips

5. **Generate Postman Collection:**
   - Use `openapi2postmanv2` or Postman's own converter
   - Save as `specs/postman/hemera-collection.json`
   - Add pre-request scripts for auth
   - Add tests for successful responses

**Important Details:**
- Base URL: `http://localhost:3000` (local) or `https://hemera.academy` (prod)
- Authentication: Clerk JWT Bearer Token in Authorization Header
- Response Format: Standardized with `success`, `data`, `requestId` fields
- Error Format: `error`, `code`, `requestId` fields
- All timestamps in ISO 8601 format
- Prices in cents (minor units)
- Currency: EUR

**References:**
- Existing OpenAPI specs in specs/*/contracts/
- API route implementations in app/api/
- Zod schemas for validation
- .spectral.yaml for linting rules
```

## Expected Deliverables

1. `specs/postman/hemera-api.yaml` - Consolidated OpenAPI 3.1.0 specification
2. `specs/postman/hemera-collection.json` - Postman Collection
3. `specs/postman/hemera-environment.json` - Postman Environment
4. `specs/postman/README.md` - Import and usage guide

## Advantages of This Approach

- **Central Documentation**: Single source for all API endpoints
- **Postman Compatibility**: Direct import possible
- **Maintainability**: Easy to update and extend
- **Validation**: Automatic checking with Spectral
- **Reusability**: Foundation for client SDKs and other tools
- **Standardization**: Unified API documentation

## Next Steps

1. Copy the executable prompt above
2. Switch to Code mode
3. Paste and execute the prompt
4. Review the generated files
5. Test the import in Postman
