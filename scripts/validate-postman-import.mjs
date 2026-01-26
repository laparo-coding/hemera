#!/usr/bin/env node
/**
 * Postman Import Validation Script
 * Feature: 019-OpenAPI-Postman
 *
 * Validates that the generated Postman collection:
 * 1. Has valid JSON structure
 * 2. All endpoints have examples
 * 3. Auth headers are properly configured
 * 4. Environment variables are referenced correctly
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLLECTION_PATH = path.join(__dirname, '../docs/api/hemera.postman.json');
const ENV_PATH = path.join(__dirname, '../docs/api/hemera.env.json');

const errors = [];
const warnings = [];

function log(type, message) {
  if (type === 'error') {
    errors.push(message);
    console.error(`❌ ERROR: ${message}`);
  } else if (type === 'warn') {
    warnings.push(message);
    console.warn(`⚠️  WARN: ${message}`);
  } else {
    console.log(`✅ ${message}`);
  }
}

function validateCollectionStructure(collection) {
  // Check required top-level fields
  if (!collection.info) {
    log('error', 'Collection missing "info" object');
    return false;
  }

  if (!collection.info.name) {
    log('error', 'Collection missing "info.name"');
  }

  if (!collection.info.schema) {
    log(
      'error',
      'Collection missing "info.schema" (should be Postman Collection v2.1)'
    );
  } else if (!collection.info.schema.includes('v2.1')) {
    log('warn', `Collection schema is not v2.1: ${collection.info.schema}`);
  }

  if (!collection.item || !Array.isArray(collection.item)) {
    log('error', 'Collection missing "item" array (endpoints)');
    return false;
  }

  log('info', `Collection has ${collection.item.length} top-level items`);
  return true;
}

function countEndpoints(items, depth = 0) {
  let count = 0;
  for (const item of items) {
    if (item.request) {
      count++;
    }
    if (item.item && Array.isArray(item.item)) {
      count += countEndpoints(item.item, depth + 1);
    }
  }
  return count;
}

function validateEndpointExamples(items, path = '') {
  let missingExamples = 0;

  for (const item of items) {
    const itemPath = path ? `${path}/${item.name}` : item.name;

    if (item.request) {
      // Check for response examples
      if (!item.response || item.response.length === 0) {
        log('warn', `Missing response example: ${itemPath}`);
        missingExamples++;
      }
    }

    if (item.item && Array.isArray(item.item)) {
      missingExamples += validateEndpointExamples(item.item, itemPath);
    }
  }

  return missingExamples;
}

function validateAuthConfiguration(collection) {
  // Check if collection has auth configured
  if (!collection.auth) {
    log('warn', 'Collection does not have top-level auth configuration');
  } else {
    log('info', `Collection auth type: ${collection.auth.type}`);
  }

  // Check for Bearer token variable usage
  const collectionStr = JSON.stringify(collection);
  if (
    collectionStr.includes('{{bearer_token}}') ||
    collectionStr.includes('{{BEARER_TOKEN}}')
  ) {
    log('info', 'Collection uses bearer_token variable');
  } else if (collectionStr.includes('Bearer')) {
    log('info', 'Collection includes Bearer authentication');
  } else {
    log('warn', 'No Bearer token configuration found');
  }
}

function validateEnvironmentVariables(envData) {
  if (!envData.values || !Array.isArray(envData.values)) {
    log('error', 'Environment file missing "values" array');
    return;
  }

  const requiredVars = ['baseUrl', 'bearer_token'];
  const foundVars = envData.values.map(v => v.key);

  for (const reqVar of requiredVars) {
    if (!foundVars.includes(reqVar)) {
      log('warn', `Environment missing recommended variable: ${reqVar}`);
    }
  }

  log(
    'info',
    `Environment has ${envData.values.length} variables: ${foundVars.join(', ')}`
  );
}

async function main() {
  console.log('🔍 Validating Postman Collection...\n');

  // Check collection file exists
  if (!fs.existsSync(COLLECTION_PATH)) {
    log('error', `Collection file not found: ${COLLECTION_PATH}`);
    process.exit(1);
  }

  // Parse collection
  let collection;
  try {
    const content = fs.readFileSync(COLLECTION_PATH, 'utf-8');
    collection = JSON.parse(content);
    log('info', 'Collection JSON is valid');
  } catch (e) {
    log('error', `Failed to parse collection JSON: ${e.message}`);
    process.exit(1);
  }

  // Validate structure
  if (!validateCollectionStructure(collection)) {
    process.exit(1);
  }

  // Count endpoints
  const endpointCount = countEndpoints(collection.item);
  log('info', `Total endpoints: ${endpointCount}`);

  // Validate examples
  const missingExamples = validateEndpointExamples(collection.item);
  if (missingExamples > 0) {
    log('warn', `${missingExamples} endpoints missing response examples`);
  }

  // Validate auth
  validateAuthConfiguration(collection);

  // Check environment file
  console.log('\n🔍 Validating Environment File...\n');
  if (fs.existsSync(ENV_PATH)) {
    try {
      const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
      const envData = JSON.parse(envContent);
      log('info', 'Environment JSON is valid');
      validateEnvironmentVariables(envData);
    } catch (e) {
      log('error', `Failed to parse environment JSON: ${e.message}`);
    }
  } else {
    log('warn', `Environment file not found: ${ENV_PATH}`);
  }

  // Summary
  console.log('\n📊 Validation Summary');
  console.log('='.repeat(40));
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Validation FAILED');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\n⚠️  Validation PASSED with warnings');
    process.exit(0);
  } else {
    console.log('\n✅ Validation PASSED');
    process.exit(0);
  }
}

main();
