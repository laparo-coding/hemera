import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

async function main() {
  const { data: users } = await clerk.users.getUserList({ limit: 100 });

  console.log('Alle Clerk-Benutzer:\n');
  for (const u of users) {
    const emails = u.emailAddresses.map(e => e.emailAddress).join(', ');
    const role = (u.publicMetadata?.role as string) || 'user';
    console.log(`- ${emails} (Rolle: ${role})`);
  }
}

main();
