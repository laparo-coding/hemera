import { CourseLevel, CourseMaterialType } from '@prisma/client';
import { closeDb, prisma } from '../lib/db/prisma';
import {
  checkProductionDatabase,
  getDatabaseEnvironmentInfo,
} from '../lib/db/production-guard';

type CourseSeed = {
  slug: string;
  title: string;
  description: string;
  teaser: string;
  price: number;
  capacity: number;
  level: CourseLevel;
  instructor: string;
  isPublished: boolean;
  startDate: Date;
  startTime: Date;
  endTime: Date;
};

type MaterialSeed = {
  identifier: string;
  title: string;
  type: CourseMaterialType;
  blobUrl: string;
  blobPathname: string;
};

const e2ePdfDataUrl =
  'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrPgoxIDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iagoyIDAgb2JqCjw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDIwMCAyMDBdL0NvbnRlbnRzIDQgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDQ0Pj4Kc3RyZWFtCkJUCjcwIDEyMCBURApFVFQKKEhlbWVyYSBFMkUgSW52b2ljZSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYT4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2NCAwMDAwMCBuIAowMDAwMDAwMTIxIDAwMDAwIG4gCjAwMDAwMDAyMTIgMDAwMDAgbiAKMDAwMDAwMDMyNiAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNi9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjQwNgolJUVPRgo=';

const courseSeeds: CourseSeed[] = [
  {
    slug: 'grundkurs',
    title: 'Grundlagen der Gehaltsverhandlung',
    description:
      'Lerne die fundamentalen Strategien und Techniken fuer erfolgreiche Gehaltsverhandlungen. Perfekt fuer den Einstieg.',
    teaser: 'Der belastbare Einstieg fuer erste Gehalts- und Honorargespräche.',
    price: 14900,
    capacity: 25,
    level: 'BEGINNER',
    instructor: 'Hemera Team',
    isPublished: true,
    startDate: new Date('2026-01-15T00:00:00.000Z'),
    startTime: new Date('2026-01-15T10:00:00.000Z'),
    endTime: new Date('2026-01-15T14:00:00.000Z'),
  },
  {
    slug: 'fortgeschrittene',
    title: 'Fortgeschrittene Verhandlungsstrategien',
    description:
      'Vertiefe deine Kenntnisse mit fortgeschrittenen Taktiken und lerne, auch schwierige Situationen sicher zu steuern.',
    teaser: 'Praxisnahe Taktiken fuer komplexere Verhandlungssituationen.',
    price: 29900,
    capacity: 20,
    level: 'INTERMEDIATE',
    instructor: 'Hemera Team',
    isPublished: true,
    startDate: new Date('2026-05-20T00:00:00.000Z'),
    startTime: new Date('2026-05-20T14:00:00.000Z'),
    endTime: new Date('2026-05-20T18:00:00.000Z'),
  },
  {
    slug: 'masterclass',
    title: 'Masterclass: Exzellenz in Verhandlungen',
    description:
      'Meistere die Kunst der Verhandlung auf hoechstem Niveau und erreiche deine anspruchsvollsten Ziele.',
    teaser: 'Der anspruchsvolle Aufbaukurs fuer Fuehrungskraefte und Senior Profiles.',
    price: 49900,
    capacity: 12,
    level: 'ADVANCED',
    instructor: 'Hemera Team',
    isPublished: true,
    startDate: new Date('2026-06-28T00:00:00.000Z'),
    startTime: new Date('2026-06-28T10:00:00.000Z'),
    endTime: new Date('2026-06-28T16:00:00.000Z'),
  },
  {
    slug: 'e2e-draft-course',
    title: 'Entwurfskurs fuer lokale E2E-Tests',
    description:
      'Unveroeffentlichter Kurs, damit Admin- und Publish-Toggle-Szenarien lokal reproduzierbar bleiben.',
    teaser: 'Lokaler Entwurfskurs fuer Admin-Regressionen.',
    price: 9900,
    capacity: 8,
    level: 'BEGINNER',
    instructor: 'Hemera QA',
    isPublished: false,
    startDate: new Date('2026-03-10T00:00:00.000Z'),
    startTime: new Date('2026-03-10T09:00:00.000Z'),
    endTime: new Date('2026-03-10T11:00:00.000Z'),
  },
];

const materialSeeds: MaterialSeed[] = [
  {
    identifier: 'E2E-MAT-001',
    title: 'Workbook Grundlagen',
    type: 'CONTENT',
    blobUrl: 'https://example.invalid/hemera/e2e/workbook-grundlagen.pdf',
    blobPathname: 'hemera/e2e/workbook-grundlagen.pdf',
  },
  {
    identifier: 'E2E-MAT-002',
    title: 'Seminarfolien Fortgeschrittene',
    type: 'SLIDE_CONTROL',
    blobUrl: 'https://example.invalid/hemera/e2e/fortgeschrittene-slides.pdf',
    blobPathname: 'hemera/e2e/fortgeschrittene-slides.pdf',
  },
  {
    identifier: 'E2E-MAT-003',
    title: 'Masterclass Handout',
    type: 'CONTENT',
    blobUrl: 'https://example.invalid/hemera/e2e/masterclass-handout.pdf',
    blobPathname: 'hemera/e2e/masterclass-handout.pdf',
  },
];

const locationSeed = {
  slug: 'e2e-wien-studio',
  name: 'Hemera Studio Wien',
  address: 'Mariahilfer Strasse 100',
  city: 'Wien',
  zipCode: '1070',
  email: 'studio@example.com',
  phone: '+43 1 1234567',
  website: 'https://example.invalid/hemera/studio',
};

const mockUserSeed = {
  id: 'e2e_mock_user',
  email: 'e2e@example.com',
  name: 'E2E User',
  image: null,
};

function waitForRemoteSeedCountdown(
  databaseUrl: string,
  allowRemoteSeed: boolean,
  delayMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    let remainingSeconds = Math.max(1, Math.ceil(delayMs / 1000));

    const cleanup = () => {
      clearInterval(interval);
      clearTimeout(timeout);
      process.off('SIGINT', handleSigint);
    };

    const handleSigint = () => {
      cleanup();
      reject(
        new Error(
          `Lokaler E2E-Seed abgebrochen: Remote-Override fuer ${databaseUrl} wurde per SIGINT beendet.`
        )
      );
    };

    // biome-ignore lint/suspicious/noConsole: CLI safety warning for remote seed overrides
    console.warn(
      `⚠️  Remote-E2E-Seed-Override aktiv fuer ${databaseUrl} (ALLOW_REMOTE_E2E_SEED=${allowRemoteSeed}). Weiter in ${remainingSeconds}s, Ctrl+C zum Abbrechen.`
    );

    const interval = setInterval(() => {
      remainingSeconds -= 1;
      if (remainingSeconds > 0) {
        // biome-ignore lint/suspicious/noConsole: CLI countdown for remote seed overrides
        console.warn(
          `⏳ Remote-E2E-Seed startet in ${remainingSeconds}s fuer ${databaseUrl}`
        );
      }
    }, 1000);

    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, delayMs);

    process.once('SIGINT', handleSigint);
  });
}

async function assertSeedTargetIsAllowed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL ist nicht gesetzt. Lade .env.local vor dem Lauf.');
  }

  const requiredEnvGroups = [
    ['STRIPE_SECRET_KEY', 'STRIPE_API_KEY'],
    ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY'],
    ['CLERK_SECRET_KEY', 'CLERK_API_KEY'],
    ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
  ];
  const missingEnvGroups = requiredEnvGroups.filter(group =>
    !group.some(envName => process.env[envName]?.trim())
  );

  if (missingEnvGroups.length > 0) {
    const missingEnvNames = missingEnvGroups
      .map(group => group.join(' oder '))
      .join(', ');

    throw new Error(
      `Lokaler E2E-Seed abgebrochen: folgende Secrets fehlen (${missingEnvNames}). Lade .env.local vor dem Lauf.`
    );
  }

  const productionCheck = checkProductionDatabase();
  const allowRemoteSeed =
    process.env.ALLOW_REMOTE_E2E_SEED === '1' ||
    process.env.ALLOW_REMOTE_E2E_SEED === 'true';
  const parsedRemoteSeedDelay = Number.parseInt(
    process.env.E2E_REMOTE_SEED_DELAY_MS || '',
    10
  );
  const remoteSeedDelayMs = Number.isFinite(parsedRemoteSeedDelay)
    ? Math.max(1000, parsedRemoteSeedDelay)
    : 5000;

  if (process.env.VERCEL_ENV === 'production') {
    throw new Error(
      `Lokaler E2E-Seed abgebrochen: Produktionsumgebung erkannt (${productionCheck.databaseUrl}).`
    );
  }

  if (productionCheck.isProduction) {
    if (!allowRemoteSeed) {
      throw new Error(
        `Lokaler E2E-Seed abgebrochen: Datenbankziel ist nicht lokal (${productionCheck.databaseUrl}). Setze ALLOW_REMOTE_E2E_SEED=true nur fuer einen bewusst gewollten Override.`
      );
    }

    await waitForRemoteSeedCountdown(
      productionCheck.databaseUrl,
      allowRemoteSeed,
      remoteSeedDelayMs
    );
  }
}

async function seedCourses() {
  const location = await prisma.location.upsert({
    where: { slug: locationSeed.slug },
    create: locationSeed,
    update: locationSeed,
  });

  for (const course of courseSeeds) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      create: {
        ...course,
        currency: 'EUR',
        locationId: location.id,
      },
      update: {
        ...course,
        currency: 'EUR',
        locationId: location.id,
      },
    });
  }
}

async function seedMaterials() {
  for (const material of materialSeeds) {
    await prisma.courseMaterial.upsert({
      where: { identifier: material.identifier },
      create: material,
      update: material,
    });
  }
}

async function seedMockUserDashboardData() {
  await prisma.user.upsert({
    where: { id: mockUserSeed.id },
    create: mockUserSeed,
    update: mockUserSeed,
  });

  const courses = await prisma.course.findMany({
    where: {
      slug: { in: courseSeeds.map(course => course.slug) },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const courseBySlug = new Map(courses.map(course => [course.slug, course.id]));

  const bookings = [
    {
      courseSlug: 'fortgeschrittene',
      paymentStatus: 'PAID' as const,
      amount: 29900,
      currency: 'EUR',
      stripeInvoiceId: 'inv_e2e_upcoming_paid',
      stripeInvoicePdfUrl: e2ePdfDataUrl,
      stripeInvoiceUrl: 'https://example.invalid/invoices/inv_e2e_upcoming_paid',
      stripeSessionId: 'cs_e2e_upcoming_paid',
      hasParticipation: false,
    },
    {
      courseSlug: 'masterclass',
      paymentStatus: 'PENDING' as const,
      amount: 49900,
      currency: 'EUR',
      stripeInvoiceId: null,
      stripeInvoicePdfUrl: null,
      stripeInvoiceUrl: null,
      stripeSessionId: 'cs_e2e_upcoming_pending',
      hasParticipation: false,
    },
    {
      courseSlug: 'grundkurs',
      paymentStatus: 'PAID' as const,
      amount: 14900,
      currency: 'EUR',
      stripeInvoiceId: 'inv_e2e_completed_paid',
      stripeInvoicePdfUrl: e2ePdfDataUrl,
      stripeInvoiceUrl: 'https://example.invalid/invoices/inv_e2e_completed_paid',
      stripeSessionId: 'cs_e2e_completed_paid',
      hasParticipation: true,
    },
    {
      courseSlug: 'e2e-draft-course',
      paymentStatus: 'PAID' as const,
      amount: 9900,
      currency: 'EUR',
      stripeInvoiceId: 'inv_e2e_noshow_paid',
      stripeInvoicePdfUrl: e2ePdfDataUrl,
      stripeInvoiceUrl: 'https://example.invalid/invoices/inv_e2e_noshow_paid',
      stripeSessionId: 'cs_e2e_noshow_paid',
      hasParticipation: false,
    },
  ];

  for (const booking of bookings) {
    const courseId = courseBySlug.get(booking.courseSlug);
    if (!courseId) {
      throw new Error(`Kurs fuer Seed-Buchung nicht gefunden: ${booking.courseSlug}`);
    }

    const persistedBooking = await prisma.booking.upsert({
      where: {
        userId_courseId: {
          userId: mockUserSeed.id,
          courseId,
        },
      },
      create: {
        userId: mockUserSeed.id,
        courseId,
        paymentStatus: booking.paymentStatus,
        amount: booking.amount,
        currency: booking.currency,
        stripeInvoiceId: booking.stripeInvoiceId,
        stripeInvoicePdfUrl: booking.stripeInvoicePdfUrl,
        stripeInvoiceUrl: booking.stripeInvoiceUrl,
        stripeSessionId: booking.stripeSessionId,
      },
      update: {
        paymentStatus: booking.paymentStatus,
        amount: booking.amount,
        currency: booking.currency,
        stripeInvoiceId: booking.stripeInvoiceId,
        stripeInvoicePdfUrl: booking.stripeInvoicePdfUrl,
        stripeInvoiceUrl: booking.stripeInvoiceUrl,
        stripeSessionId: booking.stripeSessionId,
      },
    });

    if (booking.hasParticipation) {
      await prisma.courseParticipation.upsert({
        where: { bookingId: persistedBooking.id },
        create: {
          bookingId: persistedBooking.id,
          userId: mockUserSeed.id,
          courseId,
          status: 'COMPLETE',
          summaryCompletedAt: new Date('2026-03-15T12:00:00.000Z'),
          resultCompletedAt: new Date('2026-03-20T12:00:00.000Z'),
        },
        update: {
          status: 'COMPLETE',
          userId: mockUserSeed.id,
          courseId,
          summaryCompletedAt: new Date('2026-03-15T12:00:00.000Z'),
          resultCompletedAt: new Date('2026-03-20T12:00:00.000Z'),
        },
      });
    } else {
      await prisma.courseParticipation.deleteMany({
        where: { bookingId: persistedBooking.id },
      });
    }
  }
}

async function main() {
  await assertSeedTargetIsAllowed();

  console.log('🌱 Starte additiven lokalen E2E-Seed ...');
  console.log(`📍 Datenbank: ${getDatabaseEnvironmentInfo()}`);

  await seedCourses();
  await seedMaterials();
  await seedMockUserDashboardData();

  const [courseCount, publishedCourses, materialCount, bookingCount] = await Promise.all([
    prisma.course.count({
      where: {
        slug: { in: courseSeeds.map(course => course.slug) },
      },
    }),
    prisma.course.count({
      where: {
        slug: { in: courseSeeds.map(course => course.slug) },
        isPublished: true,
      },
    }),
    prisma.courseMaterial.count({
      where: {
        identifier: { in: materialSeeds.map(material => material.identifier) },
      },
    }),
    prisma.booking.count({
      where: {
        userId: mockUserSeed.id,
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        seededCourses: courseCount,
        publishedCourses,
        seededMaterials: materialCount,
        seededBookings: bookingCount,
      },
      null,
      2
    )
  );
}

main()
  .catch(error => {
    console.error('❌ Lokaler E2E-Seed fehlgeschlagen');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });