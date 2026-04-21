import { execFileSync } from 'node:child_process';
import { test } from '@playwright/test';

function shouldRunLocalSeed(): boolean {
  return process.env.PLAYWRIGHT_ENABLE_LOCAL_DB_SEED === '1';
}

function getMissingLocalSeedSecrets(): string[] {
  const requiredEnvGroups: readonly string[][] = [
    ['STRIPE_SECRET_KEY', 'STRIPE_API_KEY'],
    ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY'],
    ['CLERK_SECRET_KEY', 'CLERK_API_KEY'],
    ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
  ];

  return requiredEnvGroups
    .filter(group => !group.some(envName => process.env[envName]?.trim()))
    .map(group => group.join(' oder '));
}

test.describe('E2E seed', () => {
  test('seed local dashboard data', () => {
    test.skip(
      !shouldRunLocalSeed(),
      'Lokaler E2E-Seed ist deaktiviert, solange PLAYWRIGHT_ENABLE_LOCAL_DB_SEED nicht auf 1 gesetzt ist.'
    );

    const missingSecrets = getMissingLocalSeedSecrets();
    test.skip(
      missingSecrets.length > 0,
      `Lokaler E2E-Seed benoetigt Secrets aus .env.local. Fehlend: ${missingSecrets.join(', ')}`
    );

    execFileSync('npm', ['run', 'db:seed:e2e-local'], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
  });
});
