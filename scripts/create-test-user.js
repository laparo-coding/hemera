#!/usr/bin/env node

import https from 'node:https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error('CLERK_SECRET_KEY environment variable is required');
  process.exit(1);
}

const userData = {
  email_address: [
    'e2e.test@example.com',
    'e2e.duplicate@example.com',
    'e2e.dashboard@example.com',
  ],
  password: 'E2ETestPassword2024!SecureForTesting',
  first_name: 'E2E',
  last_name: 'Test',
  public_metadata: {
    role: 'user',
  },
};

const postData = JSON.stringify(userData);

const options = {
  hostname: 'api.clerk.com',
  port: 443,
  path: '/v1/users',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${CLERK_SECRET_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('Creating test user in Clerk...');

const req = https.request(options, res => {
  let data = '';

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Test users created successfully!');
      console.log(
        'Emails: e2e.test@example.com, e2e.duplicate@example.com, e2e.dashboard@example.com'
      );
      console.log('Password: TestPassword123!');
      const response = JSON.parse(data);
      console.log('User ID:', response.id);
    } else {
      console.error('❌ Failed to create user');
      console.error('Status:', res.statusCode);
      console.error('Response:', data);
    }
  });
});

req.on('error', error => {
  console.error('❌ Error creating user:', error);
});

req.write(postData);
req.end();
