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

const users = [
  {
    email_address: ['e2e.test@example.com'],
    password: 'E2ETestPassword2024!SecureForTesting',
    first_name: 'E2E',
    last_name: 'Test User',
    public_metadata: {
      role: 'user',
    },
  },
];

async function createUser(userData) {
  return new Promise((resolve, reject) => {
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

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function createAllUsers() {
  console.log('Creating test users in Clerk...');

  for (const userData of users) {
    try {
      console.log(`Creating user with email: ${userData.email_address[0]}`);
      const result = await createUser(userData);

      if (result.status === 200 || result.status === 201) {
        console.log('✅ User created successfully!');
        console.log(
          `   Email: ${result.data.email_addresses[0]?.email_address}`
        );
        console.log(`   User ID: ${result.data.id}`);
      } else if (result.status === 422) {
        // User might already exist
        console.log('⚠️ User might already exist (422)');
        console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
      } else {
        console.log('❌ Failed to create user');
        console.log(`   Status: ${result.status}`);
        console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
      }
      console.log('');
    } catch (error) {
      console.error(
        `❌ Error creating user ${userData.email_address[0]}:`,
        error.message
      );
      console.log('');
    }
  }

  console.log('All users processed!');
}

createAllUsers().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
