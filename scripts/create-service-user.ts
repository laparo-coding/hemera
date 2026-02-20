#!/usr/bin/env node
/**
 * Create Aither Service User Script
 *
 * Usage: dotenv -e .env.local -- npx tsx scripts/create-service-user.ts
 *
 * Creates a dedicated service user in Clerk for the Aither-Hemera API integration.
 * If the user already exists, updates the publicMetadata to ensure the correct role.
 *
 * The script will:
 * 1. Check if aither-service@hemera-academy.com exists
 * 2. Create the user if not found (or update metadata if found)
 * 3. Output the User ID for .env configuration
 *
 * Exit Codes:
 *   0 - Success (user created or already exists with correct role)
 *   1 - Configuration error (missing CLERK_SECRET_KEY)
 *   2 - API error (Clerk API failure)
 */

import { createClerkClient } from '@clerk/backend';
import * as dotenv from 'dotenv';
import * as crypto from 'node:crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SERVICE_EMAIL = 'aither-service@hemera-academy.com';
const SERVICE_FIRST_NAME = 'Aither';
const SERVICE_LAST_NAME = 'Service';
const SERVICE_METADATA = {
  role: 'api-client',
  service: 'aither',
  description: 'Service user for Aither-Hemera API integration',
};

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY nicht gesetzt');
    console.error('   Stelle sicher, dass .env.local die Variable enthält.');
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });

  console.log(`🔍 Suche existierenden Service-User: ${SERVICE_EMAIL}\n`);

  try {
    // Check if user already exists
    const { data: existingUsers } = await clerk.users.getUserList({
      emailAddress: [SERVICE_EMAIL],
      limit: 1,
    });

    if (existingUsers.length > 0) {
      const user = existingUsers[0]!;
      const currentRole = (user.publicMetadata?.role as string) || '(keine)';

      console.log('✅ Service-User existiert bereits:');
      console.log(`   ID:    ${user.id}`);
      console.log(`   E-Mail: ${SERVICE_EMAIL}`);
      console.log(`   Aktuelle Rolle: ${currentRole}`);

      // Update metadata if role is not correct
      if (currentRole !== SERVICE_METADATA.role) {
        console.log('\n🔄 Aktualisiere publicMetadata auf api-client...');
        await clerk.users.updateUser(user.id, {
          publicMetadata: {
            ...user.publicMetadata,
            ...SERVICE_METADATA,
          },
        });
        console.log('✅ Rolle auf api-client aktualisiert!');
      } else {
        // Ensure all metadata fields are present
        const currentService = (user.publicMetadata?.service as string) || '';
        if (currentService !== 'aither') {
          console.log('\n🔄 Ergänze fehlende Metadata-Felder...');
          await clerk.users.updateUser(user.id, {
            publicMetadata: {
              ...user.publicMetadata,
              ...SERVICE_METADATA,
            },
          });
          console.log('✅ Metadata aktualisiert!');
        } else {
          console.log('\n✅ Metadata ist korrekt konfiguriert.');
        }
      }

      printNextSteps(user.id);
      return;
    }

    // User does not exist — create new service user
    console.log('📝 Service-User nicht gefunden. Erstelle neuen User...\n');

    // Generate a strong random password (not used for login, but required by Clerk)
    const password = crypto.randomBytes(32).toString('base64url');

    const newUser = await clerk.users.createUser({
      emailAddress: [SERVICE_EMAIL],
      password,
      firstName: SERVICE_FIRST_NAME,
      lastName: SERVICE_LAST_NAME,
      publicMetadata: SERVICE_METADATA,
      // Skip email verification for service accounts
      skipPasswordChecks: true,
    });

    console.log('✅ Service-User erfolgreich erstellt!');
    console.log(`   ID:       ${newUser.id}`);
    console.log(`   E-Mail:   ${SERVICE_EMAIL}`);
    console.log(`   Name:     ${SERVICE_FIRST_NAME} ${SERVICE_LAST_NAME}`);
    console.log(`   Rolle:    api-client`);
    console.log(`   Service:  aither`);

    printNextSteps(newUser.id);
  } catch (error: unknown) {
    console.error('\n❌ Fehler aufgetreten:\n');

    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error(`   Nachricht: ${message}`);

    // Handle Clerk API errors
    if (
      error &&
      typeof error === 'object' &&
      'errors' in error &&
      Array.isArray((error as { errors: unknown[] }).errors)
    ) {
      const clerkErrors = (
        error as { errors: Array<{ message?: string; code?: string; longMessage?: string }> }
      ).errors;
      console.error('\n   Clerk API Fehler:');
      for (const err of clerkErrors) {
        console.error(`   - Code: ${err.code ?? 'unbekannt'}`);
        console.error(`     Details: ${err.longMessage ?? err.message ?? 'keine Details'}`);
      }
    }

    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      typeof (error as { status: unknown }).status === 'number'
    ) {
      console.error(
        `\n   HTTP Status: ${(error as { status: number }).status}`
      );
    }

    console.error('\n📝 Mögliche Ursachen:');
    console.error('   - CLERK_SECRET_KEY ungültig oder abgelaufen');
    console.error('   - Netzwerkproblem oder Clerk API nicht erreichbar');
    console.error('   - E-Mail-Adresse bereits in einem anderen Clerk-Projekt vorhanden');

    process.exit(2);
  }
}

function printNextSteps(userId: string) {
  console.log('\n' + '═'.repeat(60));
  console.log('📋 Nächste Schritte für Aither-Konfiguration:');
  console.log('═'.repeat(60));
  console.log('\n1️⃣  Setze folgende Env-Variablen in Aither (.env.local):');
  console.log(`\n   CLERK_SERVICE_USER_ID=${userId}`);
  console.log(`   CLERK_SERVICE_USER_EMAIL=${SERVICE_EMAIL}`);
  console.log('\n2️⃣  Generiere einen API-Key (mind. 32 Zeichen):');
  console.log('   node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"');
  console.log('\n3️⃣  Setze den API-Key in beiden Projekten:');
  console.log('   Hemera (.env.local): HEMERA_SERVICE_API_KEY=<dein-api-key>');
  console.log(`   Hemera (.env.local): HEMERA_SERVICE_USER_ID=${userId}`);
  console.log('   Aither (.env.local): HEMERA_API_KEY=<dein-api-key>');
  console.log('\n4️⃣  Teste die Verbindung:');
  console.log('   curl -X GET https://www.hemera.academy/api/service/courses \\');
  console.log('     -H "X-API-Key: <dein-api-key>"');
  console.log('\n' + '═'.repeat(60));
}

main();
