#!/usr/bin/env npx tsx
/**
 * Set Admin Role Script
 *
 * Usage: npm run set-admin-role <email>
 * Example: npm run set-admin-role andreas@example.com
 *
 * This script sets the admin role for a Clerk user by email.
 */

import { createClerkClient } from '@clerk/backend';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Fehler: Bitte E-Mail-Adresse angeben');
    console.log('   Verwendung: npm run set-admin-role <email>');
    console.log('   Beispiel:   npm run set-admin-role admin@hemera.academy');
    process.exit(1);
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
      process.exit(1);
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
  } catch (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
  }
}

main();
