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
    throw new Error(`Could not query user: ${result.status}`);
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

function logUserResult(action, role, status) {
  const normalizedAction = action === 'updated' ? 'aktualisiert' : 'erstellt';
  console.log(`✅ Testuser ${normalizedAction}`);
  console.log(`   Rolle: ${role}`);
  console.log(`   Status: ${status}`);
}

function logUserFailure(action, role, status, errorCode) {
  const normalizedAction = action === 'updated' ? 'aktualisieren' : 'erstellen';
  console.log(`❌ Testuser konnte nicht ${normalizedAction} werden`);
  console.log(`   Rolle: ${role}`);
  console.log(`   Status: ${status}`);
  if (errorCode) {
    console.log(`   Fehlercode: ${errorCode}`);
  }
}

async function createAllUsers() {
  console.log('Creating test users in Clerk...');

  for (const userData of users) {
    try {
      const role = userData.public_metadata.role;
      console.log(`Ensuring ${role} test user`);

      const existingUser = await findUserByEmail(userData.email_address[0]);

      if (existingUser) {
        const result = await updateUser(existingUser.id, userData);

        if (result.status === 200) {
          logUserResult('updated', role, result.status);
        } else {
          logUserFailure(
            'updated',
            role,
            result.status,
            result.data?.errors?.[0]?.code
          );
        }
      } else {
        const result = await createUser(userData);

        if (result.status === 200 || result.status === 201) {
          logUserResult('created', role, result.status);
        } else {
          logUserFailure(
            'created',
            role,
            result.status,
            result.data?.errors?.[0]?.code
          );
        }
      }
      console.log('');
    } catch (error) {
      console.error('❌ Error creating test user:', error.message);
      console.log('');
    }
  }

  console.log('All users processed!');
}

createAllUsers().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
