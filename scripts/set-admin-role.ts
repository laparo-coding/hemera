#!/usr/bin/env npx tsx
/**
 * Set Admin Role Script
 *
 * Usage: npm run set-admin-role <email>
 * Example: npm run set-admin-role andreas@example.com
 *
 * This script sets the admin role for a Clerk user by email.
 *
 * Exit Codes:
 *   0 - Success (role set or already admin)
 *   1 - Usage error (missing email argument)
 *   2 - Validation error (invalid email format)
 *   3 - Not found (user does not exist in Clerk)
 *   4 - API error (Clerk API failure)
 */

import { createClerkClient } from '@clerk/backend';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Simple RFC5322-like email validation for CLI
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Fehler: Bitte E-Mail-Adresse angeben');
    console.log('   Verwendung: npm run set-admin-role <email>');
    console.log('   Beispiel:   npm run set-admin-role admin@hemera.academy');
    process.exit(1); // Usage error
  }

  if (!isValidEmail(email)) {
    console.error(`❌ Fehler: "${email}" ist keine gültige E-Mail-Adresse`);
    console.log('\n📝 Prüfe auf:');
    console.log('   - Fehlende @ oder Domain');
    console.log('   - Leerzeichen oder Sonderzeichen');
    console.log('   - Tippfehler');
    process.exit(2); // Validation error
  }

  console.log(`🔍 Suche User mit E-Mail: ${email}\n`);

  try {
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    // Search for user by email
    const { data: users } = await clerk.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });

    if (users.length === 0) {
      console.error(`❌ Kein User mit E-Mail "${email}" gefunden`);
      console.log('\n📝 Mögliche Ursachen:');
      console.log('   - E-Mail-Adresse falsch geschrieben');
      console.log('   - User existiert nicht in Clerk');
      console.log('   - Falsches Clerk-Projekt in .env.local');
      process.exit(3); // User not found
    }

    const user = users[0];
    const emails = user.emailAddresses ?? [];
    const primaryEmail =
      emails.find(e => e.id === user.primaryEmailAddressId)?.emailAddress ??
      emails[0]?.emailAddress ??
      '(keine E-Mail)';
    const allEmails = emails.map(e => e.emailAddress).join(', ') || '(keine)';

    console.log('✅ User gefunden:');
    console.log(`   ID:    ${user.id}`);
    console.log(`   E-Mail: ${primaryEmail}`);
    if (emails.length > 1) {
      console.log(`   Alle E-Mails: ${allEmails}`);
    }
    console.log(
      `   Name:   ${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        '(kein Name)'
    );

    // Check current role
    const currentRole = (user.publicMetadata?.role as string) || 'user';
    console.log(`\n📋 Aktuelle Rolle: ${currentRole}`);

    if (currentRole === 'admin') {
      console.log('\n✅ User hat bereits Admin-Rolle!');
      console.log('\n⚠️  Falls "Fehler beim Laden" weiterhin erscheint:');
      console.log('   1. Melde dich ab und wieder an');
      console.log('   2. Lösche Browser-Cache/Cookies');
      console.log('   3. Prüfe ob du auf der richtigen Seite bist');
      process.exit(0);
    }

    // Set admin role
    console.log('\n🔄 Setze Admin-Rolle...');

    await clerk.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        role: 'admin',
      },
    });

    console.log('\n✅ Admin-Rolle erfolgreich gesetzt!');
    console.log('\n📝 Nächste Schritte:');
    console.log('   1. Melde dich ab (Sign Out)');
    console.log('   2. Melde dich wieder an (Sign In)');
    console.log('   3. Gehe zu /admin/testimonials');
    console.log('\n🔗 Links:');
    console.log('   - Prod:  https://www.hemera.academy/admin/testimonials');
    console.log('   - Local: http://localhost:3000/admin/testimonials');
  } catch (error: unknown) {
    console.error('\n❌ Fehler aufgetreten:\n');

    // Extract error message
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error(`   Nachricht: ${message}`);

    // Handle Clerk API errors (ClerkAPIResponseError)
    if (
      error &&
      typeof error === 'object' &&
      'errors' in error &&
      Array.isArray((error as { errors: unknown[] }).errors)
    ) {
      const clerkErrors = (
        error as { errors: Array<{ message?: string; code?: string }> }
      ).errors;
      console.error('\n   Clerk API Fehler:');
      for (const err of clerkErrors) {
        console.error(`   - Code: ${err.code ?? 'unbekannt'}`);
        console.error(`     Details: ${err.message ?? 'keine Details'}`);
      }
    }

    // Handle HTTP status if available
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
    console.error('   - Unzureichende Berechtigungen für den API-Key');

    process.exit(4); // API error
  }
}

main();
