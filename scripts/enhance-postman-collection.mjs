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
        '// Basic response validation for all endpoints',
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
        '// Check success field for 2xx responses',
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

fs.writeFileSync(COLLECTION_PATH, JSON.stringify(collection, null, 2));
console.log('✅ Added auth, pre-request script, and tests to collection');
