/**
 * Context7 SDK Integration
 * https://github.com/upstash/context7-sdk
 *
 * SECURITY: SDK only initializes when:
 * 1. CONTEXT7_ENABLED=1 (explicit opt-in)
 * 2. Valid API key is present
 *
 * This prevents accidental initialization in serverless/edge contexts.
 */

import { Context7, Context7Error } from '@upstash/context7-sdk';
import { env } from './env';

// ============================================================================
// Configuration & Validation
// ============================================================================

/**
 * Check if Context7 is explicitly enabled and properly configured
 */
function isContext7Enabled(): boolean {
  const enabled = env.CONTEXT7_ENABLED === '1';
  const apiKey = env.CONTEXT7_API_KEY;

  if (!enabled) {
    return false;
  }

  // Validate API key presence
  if (!apiKey || apiKey.trim().length === 0) {
    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint: Configuration warning in development
      console.warn(
        '[context7] CONTEXT7_ENABLED=1 but CONTEXT7_API_KEY is missing. Context7 SDK disabled.'
      );
    }
    return false;
  }

  return true;
}

/**
 * Singleton Context7 client instance (lazy initialization)
 */
let context7Client: Context7 | null = null;

function getContext7Client(): Context7 | null {
  if (!isContext7Enabled()) {
    return null;
  }

  if (!context7Client) {
    try {
      context7Client = new Context7({
        apiKey: env.CONTEXT7_API_KEY!,
      });
      if (process.env.NODE_ENV === 'development') {
        // biome-ignore lint: Configuration info in development
        console.log('[context7] Context7 SDK initialized successfully');
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        // biome-ignore lint: Configuration error in development
        console.error('[context7] Failed to initialize Context7 SDK:', err);
      }
      return null;
    }
  }

  return context7Client;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Create Context7 client (deprecated - use getContext7Client instead)
 * @deprecated Use getContext7Client() for singleton pattern
 */
export function createContext7Client(): Context7 {
  const client = getContext7Client();
  if (!client) {
    throw new Error(
      'Context7 SDK is not enabled. Set CONTEXT7_ENABLED=1 and CONTEXT7_API_KEY to enable.'
    );
  }
  return client;
}

/**
 * Search library with Context7
 * Returns null if Context7 is not enabled
 */
export async function searchLibrary(
  query: string,
  libraryName: string
): Promise<any | null> {
  const client = getContext7Client();
  if (!client) {
    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint: Configuration warning in development
      console.warn(
        '[context7] searchLibrary called but Context7 is not enabled. Returning null.'
      );
    }
    return null;
  }

  try {
    return await client.searchLibrary(query, libraryName);
  } catch (err) {
    if (err instanceof Context7Error) throw err;
    throw err;
  }
}

/**
 * Get context from Context7
 * Returns null if Context7 is not enabled
 */
export async function getContext(
  libraryId: string,
  question: string,
  opts?: any
): Promise<any | null> {
  const client = getContext7Client();
  if (!client) {
    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint: Configuration warning in development
      console.warn(
        '[context7] getContext called but Context7 is not enabled. Returning null.'
      );
    }
    return null;
  }

  return client.getContext(question, libraryId, opts || { type: 'txt' });
}

export default { createContext7Client, searchLibrary, getContext };
