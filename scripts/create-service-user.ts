#!/usr/bin/env tsx
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
import { ClerkAPIResponseError } from '@clerk/shared/error';
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
} as const;

async function main(): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY nicht gesetzt');
    console.error('   Stelle sicher, dass .env.local die Variable enthält.');
    process.exit(1);
  }

  console.log(`🔍 Suche existierenden Service-User: ${SERVICE_EMAIL}\n`);

  try {
    // createClerkClient innerhalb des try-Blocks, damit auch Runtime-Fehler
    // (z.B. ungültiger Secret Key) korrekt gefangen und mit Exit-Code 2
    // beendet werden.
    const clerk = createClerkClient({ secretKey });

    // Check if user already exists
    const { data: existingUsers } = await clerk.users.getUserList({
      emailAddress: [SERVICE_EMAIL],
      limit: 1,
    });

    if (existingUsers.length > 0) {
      const user = existingUsers[0]!;
      const currentRole =
        typeof user.publicMetadata?.role === 'string'
          ? user.publicMetadata.role
          : '(keine)';

      console.log('✅ Service-User existiert bereits:');
      console.log(`   ID:    ${user.id}`);
      console.log(`   E-Mail: ${SERVICE_EMAIL}`);
      console.log(`   Aktuelle Rolle: ${currentRole}`);

      // Check if metadata update is needed
      const currentService =
        typeof user.publicMetadata?.service === 'string'
          ? user.publicMetadata.service
          : '';
      const needsUpdate =
        currentRole !== 'api-client' || currentService !== 'aither';

      if (needsUpdate) {
        console.log('\n🔄 Aktualisiere publicMetadata...');
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
      // Skip password complexity checks (e.g. min-length rules) for service accounts
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

    // Handle Clerk API errors using the official error type
    if (error instanceof ClerkAPIResponseError) {
      console.error(`\n   HTTP Status: ${error.status}`);
      console.error('\n   Clerk API Fehler:');
      for (const err of error.errors) {
        const codeLabel = err.code ?? 'unbekannt';
        const detailsLabel =
          err.longMessage ?? err.message ?? 'keine Details';
        console.error(`   - Code: ${codeLabel}`);
        console.error(`     Details: ${detailsLabel}`);
      }
    }

    console.error('\n📝 Mögliche Ursachen:');
    console.error('   - CLERK_SECRET_KEY ungültig oder abgelaufen');
    console.error('   - Netzwerkproblem oder Clerk API nicht erreichbar');
    console.error('   - E-Mail-Adresse bereits in einem anderen Clerk-Projekt vorhanden');

    process.exit(2);
  }
}

function printNextSteps(userId: string): void {
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
  const baseUrl = process.env.HEMERA_BASE_URL ?? 'https://<your-hemera-instance>';
  console.log(`   curl -X GET ${baseUrl}/api/service/courses \\`);
  console.log('     -H "X-API-Key: <dein-api-key>"');
  console.log('\n' + '═'.repeat(60));
}

main().catch((err: unknown) => {
  console.error('Unbehandelter Fehler:', err);
  // Exit-Code 2 für unbehandelte Runtime-/Promise-Fehler (Config-Fehler verwenden 1)
  process.exit(2);
});
