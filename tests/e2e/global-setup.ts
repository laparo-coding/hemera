import { config } from 'dotenv';

// Load environment variables from .env.local for E2E tests
config({ path: '.env.local' });

// Set test mode for E2E tests
process.env.E2E_TEST = 'true';

// Optional: Add any global setup logic here
export default async function globalSetup() {
  console.log(
    '🔧 E2E Global Setup: Environment variables loaded, NODE_ENV set to test'
  );
}
