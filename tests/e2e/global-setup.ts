import { config } from 'dotenv';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import {
  isCiEnvironment,
  isProcessEnvFlagEnabled,
} from '../../lib/utils/env-flags';

// Load environment variables from .env.local for E2E tests
config({ path: '.env.local', quiet: true });

// Set test mode for E2E tests
process.env.E2E_TEST = '1';

function shouldCreateClerkUsers() {
  return isProcessEnvFlagEnabled('E2E_CREATE_USERS');
}

function getClerkUserCreationSkipReason() {
  if (isCiEnvironment()) {
    return 'CI-Umgebung erkannt';
  }

  if (!shouldCreateClerkUsers()) {
    return 'E2E_CREATE_USERS nicht explizit aktiviert';
  }

  if (!process.env.CLERK_SECRET_KEY) {
    return 'kein CLERK_SECRET_KEY konfiguriert';
  }

  if (!process.env.E2E_TEST_PASSWORD) {
    return 'kein E2E_TEST_PASSWORD konfiguriert';
  }

  return null;
}

function getClerkUserCreationEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: process.env.NODE_ENV,
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    E2E_TEST_PASSWORD: process.env.E2E_TEST_PASSWORD,
  };
}

// Optional: Add any global setup logic here
export default async function globalSetup() {
  const skipReason = getClerkUserCreationSkipReason();

  if (skipReason) {
    console.info(
      `[e2e:global-setup] Überspringe Clerk-Testuser-Erstellung (${skipReason}). Setze E2E_CREATE_USERS=true nur in lokalen Umgebungen, wenn die Erstellung bewusst gewünscht ist.`
    );
    return;
  }

  const scriptPath = path.join(process.cwd(), 'scripts/create-multiple-test-users.js');

  try {
    execFileSync(process.execPath, [scriptPath], {
      stdio: 'pipe',
      cwd: process.cwd(),
      env: getClerkUserCreationEnv(),
    });
  } catch {
    // Best effort only: local/CI environments without Clerk write access should not hard-fail here.
    console.info(
      '[e2e:global-setup] Clerk-Testuser-Erstellung konnte nicht ausgeführt werden und wird ohne Abbruch ignoriert.'
    );
  }
}
