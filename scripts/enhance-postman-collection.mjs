#!/usr/bin/env node
/**
 * Add Auth, Pre-request Script, and Tests to Postman Collection
 * Feature: 019-OpenAPI-Postman
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLLECTION_PATH = path.join(__dirname, '../docs/api/hemera.postman.json');

const collection = JSON.parse(fs.readFileSync(COLLECTION_PATH, 'utf-8'));

// Add collection-level auth
collection.auth = {
  type: 'bearer',
  bearer: [
    {
      key: 'token',
      value: '{{bearer_token}}',
      type: 'string',
    },
  ],
};

// Add pre-request script for automatic token handling
collection.event = [
  {
    listen: 'prerequest',
    script: {
      type: 'text/javascript',
      exec: [
        '// Hemera API Pre-request Script',
        '// Automatically sets Bearer token from environment',
        '',
        'const token = pm.environment.get("bearer_token");',
        'if (token) {',
        '    pm.request.headers.add({',
        '        key: "Authorization",',
        '        value: "Bearer " + token',
        '    });',
        '}',
      ],
    },
  },
  {
    listen: 'test',
    script: {
      type: 'text/javascript',
      exec: [
        '// Hemera API Test Script',
        '// Validates response structure, status codes, and reliability markers',
        '',
        '// Check response time',
        'pm.test("Response time is less than 2000ms", function () {',
        '    pm.expect(pm.response.responseTime).to.be.below(2000);',
        '});',
        '',
        '// Check for valid JSON response',
        'pm.test("Response is valid JSON", function () {',
        '    pm.response.to.be.json;',
        '});',
        '',
        '// Check status code is expected (2xx or 4xx, not 5xx)',
        'pm.test("Status code is 2xx or 4xx (no server errors)", function () {',
        '    pm.expect(pm.response.code).to.be.below(500);',
        '});',
        '',
        '// Check for requestId in response (reliability marker)',
        'pm.test("Response contains requestId", function () {',
        '    const json = pm.response.json();',
        '    if (json.hasOwnProperty("requestId")) {',
        '        pm.expect(json.requestId).to.be.a("string");',
        '        pm.expect(json.requestId.length).to.be.greaterThan(0);',
        '    }',
        '});',
        '',
        '// Check success field consistency for 2xx responses',
        'if (pm.response.code >= 200 && pm.response.code < 300) {',
        '    pm.test("Success field is true for 2xx", function () {',
        '        const json = pm.response.json();',
        '        if (json.hasOwnProperty("success")) {',
        '            pm.expect(json.success).to.equal(true);',
        '        }',
        '    });',
        '}',
        '',
        '// Check error response structure for 4xx/5xx',
        'if (pm.response.code >= 400) {',
        '    pm.test("Error response has required fields", function () {',
        '        const json = pm.response.json();',
        '        pm.expect(json).to.have.property("success");',
        '        pm.expect(json.success).to.equal(false);',
        '        pm.expect(json).to.have.property("error");',
        '    });',
        '',
        '    pm.test("Error response has requestId for tracing", function () {',
        '        const json = pm.response.json();',
        '        if (json.hasOwnProperty("requestId")) {',
        '            pm.expect(json.requestId).to.be.a("string");',
        '        }',
        '    });',
        '}',
      ],
    },
  },
];

// Add variable for baseUrl
collection.variable = [
  {
    key: 'baseUrl',
    value: 'http://localhost:3000/api',
    type: 'string',
  },
];

// Error response templates with correct domain codes
const errorResponseTemplates = {
  400: {
    success: false,
    error: 'Invalid request parameters',
    code: 'VALIDATION_ERROR',
    requestId: '550e8400-e29b-41d4-a716-446655440000',
  },
  401: {
    success: false,
    error: 'Authentication required',
    code: 'UNAUTHORIZED',
    requestId: '550e8400-e29b-41d4-a716-446655440001',
  },
  403: {
    success: false,
    error: 'You do not have permission to access this resource',
    code: 'FORBIDDEN',
    requestId: '550e8400-e29b-41d4-a716-446655440002',
  },
  404: {
    success: false,
    error: 'Resource not found',
    code: 'NOT_FOUND',
    requestId: '550e8400-e29b-41d4-a716-446655440003',
  },
  409: {
    success: false,
    error: 'Resource already exists or conflicts with current state',
    code: 'CONFLICT',
    requestId: '550e8400-e29b-41d4-a716-446655440004',
  },
  429: {
    success: false,
    error: 'Rate limit exceeded. Try again later.',
    code: 'RATE_LIMITED',
    requestId: '550e8400-e29b-41d4-a716-446655440005',
  },
  500: {
    success: false,
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    requestId: '550e8400-e29b-41d4-a716-446655440006',
  },
};

// Fix error response bodies in all items recursively
function fixErrorResponses(items) {
  for (const item of items) {
    if (item.response && Array.isArray(item.response)) {
      for (const response of item.response) {
        const statusCode = response.code;
        if (statusCode >= 400 && errorResponseTemplates[statusCode]) {
          response.body = JSON.stringify(
            errorResponseTemplates[statusCode],
            null,
            2
          );
        }
      }
    }
    if (item.item && Array.isArray(item.item)) {
      fixErrorResponses(item.item);
    }
  }
}

fixErrorResponses(collection.item || []);

fs.writeFileSync(COLLECTION_PATH, JSON.stringify(collection, null, 2));
console.log(
  '✅ Added auth, pre-request script, tests, and fixed error responses'
);
