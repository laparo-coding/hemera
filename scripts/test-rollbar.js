#!/usr/bin/env node
/**
 * Test script to verify Rollbar integration is working
 * Run with: node scripts/test-rollbar.js
 */

import 'dotenv/config';
import Rollbar from 'rollbar';

const token = process.env.ROLLBAR_HEMERA_SERVER_TOKEN_1766674885;

console.log('=== Rollbar Integration Test ===\n');
console.log('Token found:', token ? `Yes (${token.substring(0, 8)}...)` : 'No');

if (!token) {
  console.error(
    '\n❌ ROLLBAR_HEMERA_SERVER_TOKEN_1766674885 not found in .env.local!'
  );
  process.exit(1);
}

const rollbar = new Rollbar({
  accessToken: token,
  environment: 'development',
  captureUncaught: true,
  captureUnhandledRejections: true,
});

console.log('\n📤 Sending test event to Rollbar...');

rollbar.info('🧪 Rollbar Integration Test from hemera', {
  test: true,
  timestamp: new Date().toISOString(),
  source: 'scripts/test-rollbar.js',
  environment: 'development',
});

rollbar.wait(() => {
  console.log('\n✅ Test event sent successfully!');
  console.log('🔗 Check: https://rollbar.com/Laparo/hemera/items/');
  process.exit(0);
});
