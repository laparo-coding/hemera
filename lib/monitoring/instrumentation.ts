/**
 * Rollbar initialization for Next.js App Router
 * Ensures Rollbar is properly configured on both server and client side
 */

import { deploymentMonitor } from '@/lib/monitoring/deployment-monitor';
import { rollbar } from '@/lib/monitoring/rollbar-official';

// Initialize Rollbar on app startup
if (typeof window === 'undefined') {
  // Server-side initialization
  // Rollbar server monitoring initialized

  // Start deployment monitoring in production
  if (process.env.NODE_ENV === 'production') {
    // Delay startup to allow other services to initialize
    setTimeout(() => {
      deploymentMonitor.startContinuousMonitoring(5); // Every 5 minutes
    }, 30000); // 30 second delay
  }
} else {
  // Client-side initialization will be handled by rollbar-client.ts
  // Rollbar client monitoring ready
}

// Export for Next.js instrumentation
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Rollbar instrumentation registered for Node.js runtime

    // Initialize deployment monitoring for production
    if (process.env.NODE_ENV === 'production') {
      deploymentMonitor.performHealthChecks();
    }
  }
}

export default rollbar;
