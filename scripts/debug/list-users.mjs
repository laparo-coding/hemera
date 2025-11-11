import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

try {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    },
    orderBy: {
      id: 'asc',
    },
  });

  if (!users.length) {
    console.log('Keine Benutzer in der lokalen Datenbank.');
  } else {
    console.log(`Benutzeranzahl: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.id} | ${user.email ?? 'ohne E-Mail'} | ${user.name ?? 'ohne Namen'}`);
    });
  }
} catch (error) {
  console.error('Fehler beim Abrufen der Benutzer:', error);
} finally {
  await prisma.$disconnect();
}
