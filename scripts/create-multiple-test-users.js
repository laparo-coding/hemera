#!/usr/bin/env node

import https from 'node:https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

if (!CLERK_SECRET_KEY) {
  console.error('CLERK_SECRET_KEY environment variable is required');
  process.exit(1);
}

if (!E2E_TEST_PASSWORD) {
  console.error('E2E_TEST_PASSWORD environment variable is required');
  process.exit(1);
}

const users = [
  {
    email_address: ['e2e.test@example.com'],
    password: E2E_TEST_PASSWORD,
    first_name: 'E2E',
    last_name: 'Test User',
    public_metadata: {
      role: 'user',
    },
  },
  {
    email_address: ['e2e.dashboard@example.com'],
    password: E2E_TEST_PASSWORD,
    first_name: 'E2E',
    last_name: 'Dashboard User',
    public_metadata: {
      role: 'user',
    },
  },
  {
    email_address: ['e2e.admin@example.com'],
    password: E2E_TEST_PASSWORD,
    first_name: 'E2E',
    last_name: 'Admin User',
    public_metadata: {
      role: 'admin',
    },
  },
  {
    email_address: ['e2e.duplicate@example.com'],
    password: E2E_TEST_PASSWORD,
    first_name: 'E2E',
    last_name: 'Duplicate User',
    public_metadata: {
      role: 'user',
    },
  },
];

async function clerkRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;

    const options = {
      hostname: 'api.clerk.com',
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        ...(payload
          ? { 'Content-Length': Buffer.byteLength(payload) }
          : undefined),
      },
    };

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

async function findUserByEmail(email) {
  const result = await clerkRequest(
    `/v1/users?email_address=${encodeURIComponent(email)}`,
    'GET'
  );

  if (result.status !== 200 || !Array.isArray(result.data)) {
    throw new Error(`Could not query user ${email}: ${result.status}`);
  }

  return (
    result.data.find(user =>
      user.email_addresses?.some(address => address.email_address === email)
    ) ?? null
  );
}

async function createUser(userData) {
  return clerkRequest('/v1/users', 'POST', userData);
}

async function updateUser(userId, userData) {
  return clerkRequest(`/v1/users/${userId}`, 'PATCH', {
    password: userData.password,
    first_name: userData.first_name,
    last_name: userData.last_name,
    public_metadata: userData.public_metadata,
  });
}

async function createAllUsers() {
  console.log('Creating test users in Clerk...');

  for (const userData of users) {
    try {
      const email = userData.email_address[0];
      console.log(`Ensuring user with email: ${email}`);

      const existingUser = await findUserByEmail(email);

      if (existingUser) {
        const result = await updateUser(existingUser.id, userData);

        if (result.status === 200) {
          console.log('✅ User updated successfully!');
          console.log(`   Email: ${email}`);
          console.log(`   User ID: ${existingUser.id}`);
          console.log(`   Role: ${userData.public_metadata.role}`);
        } else {
          console.log('❌ Failed to update user');
          console.log(`   Status: ${result.status}`);
          console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
        }
      } else {
        const result = await createUser(userData);

        if (result.status === 200 || result.status === 201) {
          console.log('✅ User created successfully!');
          console.log(
            `   Email: ${result.data.email_addresses[0]?.email_address}`
          );
          console.log(`   User ID: ${result.data.id}`);
          console.log(`   Role: ${userData.public_metadata.role}`);
        } else {
          console.log('❌ Failed to create user');
          console.log(`   Status: ${result.status}`);
          console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
        }
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
