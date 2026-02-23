#!/usr/bin/env npx tsx
/**
 * Idempotent script to create/update Clerk service users for API access.
 *
 * Usage:
 *   npx tsx scripts/create-clerk-service-users.ts
 *
 * Required env vars:
 *   CLERK_SECRET_KEY - Clerk backend API secret
 *
 * The script will:
 *   1. Check if each service user already exists (by email)
 *   2. Create the user if missing, or update publicMetadata if it exists
 *   3. Print the user ID for CI verification
 *
 * Safe to run multiple times (idempotent).
 */

import { createClerkClient } from '@clerk/backend';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface ServiceUserConfig {
  email: string;
  firstName: string;
  lastName: string;
  publicMetadata: {
    role: string;
    service: string;
  };
}

const SERVICE_USERS: ServiceUserConfig[] = [
  {
    email: 'aither-service@hemera-academy.com',
    firstName: 'Aither',
    lastName: 'Service',
    publicMetadata: { role: 'api-client', service: 'aither' },
  },
  {
    email: 'gaia-service@hemera-academy.com',
    firstName: 'Gaia',
    lastName: 'Service',
    publicMetadata: { role: 'api-client', service: 'gaia' },
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY environment variable is required');
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });

  console.log('🔧 Creating/updating Clerk service users…\n');

  for (const config of SERVICE_USERS) {
    try {
      await upsertServiceUser(clerk, config);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to process ${config.email}: ${message}`);
      process.exit(1);
    }
  }

  console.log('\n✅ All service users are up to date.');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function upsertServiceUser(
  clerk: ReturnType<typeof createClerkClient>,
  config: ServiceUserConfig
) {
  // Search for existing user by email
  const existingUsers = await clerk.users.getUserList({
    emailAddress: [config.email],
    limit: 1,
  });

  if (existingUsers.data.length > 0) {
    const user = existingUsers.data[0];
    if (!user) {
      console.log(`⚠ ${config.email}: unexpected empty result`);
      return;
    }
    const currentMeta = user.publicMetadata as Record<string, unknown>;

    // Check if metadata needs updating
    if (
      currentMeta.role === config.publicMetadata.role &&
      currentMeta.service === config.publicMetadata.service
    ) {
      console.log(
        `✔ ${config.email} already exists (ID: ${user.id}) — metadata correct`
      );
      return;
    }

    // Update metadata
    await clerk.users.updateUser(user.id, {
      publicMetadata: config.publicMetadata,
    });
    console.log(
      `🔄 ${config.email} updated (ID: ${user.id}) — metadata refreshed`
    );
    return;
  }

  // Create new user
  // Clerk API requires a password for user creation, but this password is
  // intentionally disposable — service users authenticate exclusively via
  // backend API tokens, never via password-based login.
  const password = generateSecurePassword();

  const newUser = await clerk.users.createUser({
    emailAddress: [config.email],
    firstName: config.firstName,
    lastName: config.lastName,
    password,
    publicMetadata: config.publicMetadata,
    skipPasswordChecks: true,
  });

  console.log(`✨ ${config.email} created (ID: ${newUser.id})`);
  console.log(
    `   ℹ️  Password is a Clerk API requirement only — service users authenticate via backend tokens.`
  );
}

/**
 * Generate a cryptographically random password.
 * Only used for initial user creation — service users should authenticate
 * via Clerk backend API tokens, not passwords.
 */
function generateSecurePassword(): string {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const length = 32;
  // Use rejection sampling to avoid modulo bias
  const maxValid = 256 - (256 % chars.length);
  const result: string[] = [];
  while (result.length < length) {
    const randomBytes = new Uint8Array(length - result.length);
    crypto.getRandomValues(randomBytes);
    for (const b of randomBytes) {
      if (b < maxValid && result.length < length) {
        const char = chars[b % chars.length];
        if (char) result.push(char);
      }
    }
  }
  return result.join('');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
