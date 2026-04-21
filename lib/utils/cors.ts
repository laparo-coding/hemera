/**
 * CORS Configuration Utility
 * Feature: 024-admin-dashboard
 *
 * Centralized CORS header management for API routes.
 * Restricts to same origin for security (no wildcard).
 */

import { NextResponse } from 'next/server';

/**
 * Get CORS headers for API responses
 * Restricts Access-Control-Allow-Origin to the application domain for security
 */
export function getCorsHeaders(): Record<string, string> {
  // Use VERCEL_URL for production, localhost for development
  const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Apply CORS headers to a response object
 * Helper function to reduce boilerplate in API route handlers
 */
export function applyCorsHeaders(
  response: NextResponse<unknown>,
  corsHeaders: Record<string, string> = getCorsHeaders()
): NextResponse<unknown> {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a standardized CORS preflight response for API routes.
 */
export function createCorsPreflightResponse(
  corsHeaders: Record<string, string> = getCorsHeaders()
): NextResponse<unknown> {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
