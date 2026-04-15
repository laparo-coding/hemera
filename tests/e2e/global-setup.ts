import { config } from 'dotenv';

// Load environment variables from .env.local for E2E tests
config({ path: '.env.local', quiet: true });

// Set test mode for E2E tests
process.env.E2E_TEST = '1';

// Optional: Add any global setup logic here
export default async function globalSetup() {
  // console.log entfernt (Lint-Regel):
  // 🔧 E2E Global Setup: Environment variables loaded, NODE_ENV set to test
}
