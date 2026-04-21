import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

const ENV_FILES = ['.env.local', '.env.development.local', '.env'];
export const DEFAULT_COURSE_BACKUP_PATH = null;

export function loadEnvironment() {
  for (const envFile of ENV_FILES) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      loadEnv({ path: envPath, override: false });
    }
  }
}

function parseArguments(argv) {
  const args = argv.slice(2);
  const backupPath = args.find(arg => !arg.startsWith('--'));

  return {
    backupPath,
    dryRun: args.includes('--dry-run'),
  };
}

function printUsageAndExit() {
  console.error(
    'Verwendung: node scripts/ops/restore-courses-from-backup.mjs <backup-dir|backup.tar.gz> [--dry-run]'
  );
  process.exit(1);
}

function resolveRequestedBackupPath(backupPath) {
  return (
    backupPath || process.env.HEMERA_COURSE_BACKUP_PATH || DEFAULT_COURSE_BACKUP_PATH
  );
}

function maskConnectionString(connectionString) {
  try {
    const parsed = new URL(connectionString);
    return `${parsed.protocol}//${parsed.username ? `${parsed.username}:***@` : ''}${parsed.host}${parsed.pathname}`;
  } catch {
    return '<ungueltige-database-url>';
  }
}

function extractArchive(archivePath) {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'hemera-course-restore-')
  );

  try {
    execFileSync('tar', ['-xzf', archivePath, '-C', tempDir], {
      stdio: 'inherit',
    });

    const backupDirectory = fs
      .readdirSync(tempDir, { withFileTypes: true })
      .find(entry => entry.isDirectory() && entry.name.startsWith('backup_'));

    if (!backupDirectory) {
      throw new Error('Kein backup_* Verzeichnis im Archiv gefunden.');
    }

    return {
      cleanup: () => fs.rmSync(tempDir, { recursive: true, force: true }),
      resolvedPath: path.join(tempDir, backupDirectory.name),
    };
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}

function resolveBackupDirectory(backupPath) {
  const resolvedPath = path.resolve(process.cwd(), backupPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Backup-Pfad nicht gefunden: ${resolvedPath}`);
  }

  const stat = fs.statSync(resolvedPath);

  if (stat.isDirectory()) {
    return {
      cleanup: () => {},
      resolvedPath,
    };
  }

  if (resolvedPath.endsWith('.tar.gz')) {
    return extractArchive(resolvedPath);
  }

  throw new Error(
    'Backup muss entweder ein entpacktes backup_* Verzeichnis oder ein .tar.gz Archiv sein.'
  );
}

function readJsonArray(backupDirectory, fileName) {
  const filePath = path.join(backupDirectory, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup-Datei fehlt: ${fileName}`);
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(rawData);

  if (!Array.isArray(parsed)) {
    throw new Error(`Backup-Datei ${fileName} enthaelt kein Array.`);
  }

  return parsed;
}

export function loadCourseBackupData(backupPath) {
  const requestedBackupPath = resolveRequestedBackupPath(backupPath);
  const { cleanup, resolvedPath } = resolveBackupDirectory(requestedBackupPath);

  try {
    const backupLocations = readJsonArray(resolvedPath, 'Location.json');
    const backupCourses = readJsonArray(resolvedPath, 'Course.json');

    return {
      backupLocations,
      backupCourses,
      cleanup,
      resolvedPath,
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}

function toNullableDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeLocation(location) {
  return {
    address: location.address,
    city: location.city,
    createdAt: toNullableDate(location.createdAt) ?? new Date(),
    description: location.description ?? null,
    email: location.email ?? null,
    imageUrl: location.imageUrl ?? null,
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    name: location.name,
    phone: location.phone ?? null,
    roomImageUrl: location.roomImageUrl ?? null,
    slug: location.slug,
    updatedAt: toNullableDate(location.updatedAt) ?? new Date(),
    website: location.website ?? null,
    zipCode: location.zipCode ?? null,
  };
}

function normalizeCourse(course, locationIdBySlug, log) {
  let resolvedLocationId = null;

  if (course.locationSlug) {
    resolvedLocationId = locationIdBySlug.get(course.locationSlug) ?? null;
    if (!resolvedLocationId) {
      log(
        `WARN: Location-Slug ${course.locationSlug} konnte fuer Kurs ${course.slug} nicht aufgeloest werden. locationId wird auf null gesetzt.`
      );
    }
  } else if (course.locationId) {
    log(
      `WARN: Backup-Kurs ${course.slug} enthaelt keine locationSlug-Zuordnung. locationId wird auf null gesetzt.`
    );
  }

  return {
    capacity: course.capacity ?? 20,
    createdAt: toNullableDate(course.createdAt) ?? new Date(),
    currency: course.currency ?? 'EUR',
    description: course.description ?? null,
    endTime: toNullableDate(course.endTime),
    heroVideoPlaybackId: course.heroVideoPlaybackId ?? null,
    imageDetail: course.imageDetail ?? null,
    imageTwitter: course.imageTwitter ?? null,
    instructor: course.instructor ?? 'TBD',
    isPublished: Boolean(course.isPublished),
    level: course.level ?? 'BEGINNER',
    locationId: resolvedLocationId,
    price: course.price,
    slug: course.slug,
    startDate: toNullableDate(course.startDate),
    startTime: toNullableDate(course.startTime),
    teaser: course.teaser ?? null,
    thumbnailUrl: course.thumbnailUrl ?? null,
    title: course.title,
    updatedAt: toNullableDate(course.updatedAt) ?? new Date(),
  };
}

export async function createPrismaResources() {
  const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
  if (accelerateUrl) {
    return {
      prisma: new PrismaClient({ accelerateUrl, log: ['error'] }),
      close: async () => {},
    };
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL ist nicht gesetzt.');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSL !== 'false' ? { rejectUnauthorized: true } : false,
  });

  return {
    prisma: new PrismaClient({
      adapter: new PrismaPg(pool),
      log: ['error'],
    }),
    close: async () => {
      await pool.end();
    },
  };
}

export async function upsertCoursesFromBackup({
  prisma,
  backupPath,
  dryRun = false,
  log = console.log,
}) {
  const usedUrl = process.env.PRISMA_ACCELERATE_URL || process.env.DATABASE_URL || '';

  const { backupLocations, backupCourses, cleanup, resolvedPath } =
    loadCourseBackupData(backupPath);

  try {
    const existingCourses = await prisma.course.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
      },
    });

    log('Ziel-Datenbank:', maskConnectionString(usedUrl));
    log('Backup-Verzeichnis:', resolvedPath);
    log('Backup-Locations:', backupLocations.length);
    log('Backup-Kurse:', backupCourses.length);
    log('Vorhandene Kurse in DB:', existingCourses.length);

    const backupCourseSlugs = new Set(backupCourses.map(course => course.slug));
    const missingInDatabase = backupCourses.filter(
      backupCourse =>
        !existingCourses.some(existingCourse => existingCourse.slug === backupCourse.slug)
    );
    const additionalInDatabase = existingCourses.filter(
      existingCourse => !backupCourseSlugs.has(existingCourse.slug)
    );

    if (missingInDatabase.length > 0) {
      log('Fehlende Kurse:', missingInDatabase.map(course => course.slug).join(', '));
    }

    if (additionalInDatabase.length > 0) {
      log(
        'Zusätzliche DB-Kurse bleiben unberührt:',
        additionalInDatabase.map(course => course.slug).join(', ')
      );
    }

    if (!dryRun) {
      await prisma.$transaction(async tx => {
        const locationIdBySlug = new Map();

        for (const location of backupLocations) {
          const normalizedLocation = normalizeLocation(location);
          const restoredLocation = await tx.location.upsert({
            where: { slug: normalizedLocation.slug },
            create: {
              id: location.id,
              ...normalizedLocation,
            },
            update: normalizedLocation,
          });

          locationIdBySlug.set(restoredLocation.slug, restoredLocation.id);
        }

        for (const course of backupCourses) {
          const courseWithLocationSlug = {
            ...course,
            locationSlug: backupLocations.find(
              location => location.id === course.locationId
            )?.slug,
          };

          const normalizedCourse = normalizeCourse(
            courseWithLocationSlug,
            locationIdBySlug,
            log
          );

          await tx.course.upsert({
            where: { slug: normalizedCourse.slug },
            create: {
              id: course.id,
              ...normalizedCourse,
            },
            update: normalizedCourse,
          });
        }
      });
    }

    const restoredCourses = dryRun
      ? [...backupCourses]
          .sort((left, right) => {
            const leftTime = toNullableDate(left.startDate)?.getTime() ?? 0;
            const rightTime = toNullableDate(right.startDate)?.getTime() ?? 0;
            return leftTime - rightTime;
          })
          .map(course => ({
            id: course.id,
            slug: course.slug,
            title: course.title,
            isPublished: Boolean(course.isPublished),
          }))
      : await prisma.course.findMany({
          where: {
            slug: {
              in: backupCourses.map(course => course.slug),
            },
          },
          select: {
            id: true,
            slug: true,
            title: true,
            isPublished: true,
          },
          orderBy: {
            startDate: 'asc',
          },
        });

    return {
      additionalInDatabase,
      backupCourses,
      backupLocations,
      missingInDatabase,
      resolvedPath,
      restoredCourses,
    };
  } finally {
    cleanup();
  }
}

async function restoreCoursesFromBackup() {
  loadEnvironment();

  const { backupPath, dryRun } = parseArguments(process.argv);
  const requestedBackupPath = resolveRequestedBackupPath(backupPath);

  if (!requestedBackupPath) {
    printUsageAndExit();
  }

  const { prisma, close } = await createPrismaResources();

  try {
    const result = await upsertCoursesFromBackup({
      prisma,
      backupPath: requestedBackupPath,
      dryRun,
    });

    if (dryRun) {
      console.log('Dry-Run abgeschlossen. Es wurden keine Daten geschrieben.');
      return;
    }

    console.log('Restore abgeschlossen. Wiederhergestellte Kurse:');
    for (const course of result.restoredCourses) {
      console.log(
        `- ${course.slug}: ${course.title} (${course.isPublished ? 'published' : 'draft'})`
      );
    }
  } finally {
    await prisma.$disconnect();
    await close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  restoreCoursesFromBackup().catch(error => {
    console.error(
      error instanceof Error ? error.message : 'Unbekannter Restore-Fehler'
    );
    process.exit(1);
  });
}