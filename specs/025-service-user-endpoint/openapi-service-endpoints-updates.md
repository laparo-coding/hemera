# Service API CORS and Standardized Error Response Updates
# This file documents the CORS headers and standardized error responses
# added to all Service API endpoints

# Standard Headers for all Service API responses:
# - Access-Control-Allow-Origin: * (CORS)
# - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS (CORS)
# - Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID (CORS)
# - Access-Control-Max-Age: 86400 (CORS preflight cache)
# - X-Request-ID: Unique request identifier
# - X-RateLimit-Limit: Maximum requests allowed
# - X-RateLimit-Remaining: Remaining requests in window
# - X-RateLimit-Reset: Unix timestamp when limit resets

# Standardized Error Response Schema:
# All error responses follow this structure:
# {
#   "success": false,
#   "error": {
#     "code": "ERROR_CODE",
#     "message": "User-friendly error message",
#     "details": {} // Optional, only for validation errors
#   },
#   "meta": {
#     "requestId": "req_abc123",
#     "timestamp": "2026-02-14T12:00:00Z",
#     "version": "1.0"
#   }
# }

# Error messages are sanitized to prevent leaking implementation details:
# - No database/Prisma error messages
# - No stack traces
# - No file paths
# - Generic messages for 5xx errors

# OPTIONS handlers added to all endpoints for CORS preflight:
# - /api/service/courses
# - /api/service/courses/{id}
# - /api/service/participations/{id}
# - /api/service/participations/{id}/result

# All responses return 204 No Content with CORS headers

# Success Response Schema:
# All success responses follow this structure:
# {
#   "success": true,
#   "data": {}, // Response data
#   "message": "Optional success message",
#   "meta": {
#     "requestId": "req_abc123",
#     "timestamp": "2026-02-14T12:00:00Z",
#     "version": "1.0"
#   }
# }

# Implementation:
# - lib/utils/service-api-response.ts: Central utility functions
# - All Service API endpoints updated to use standardized responses
# - Contract tests updated to verify headers and response structure
