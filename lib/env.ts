import { z } from 'zod';
import { reportError } from './monitoring/rollbar-official';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().optional().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().optional().default('/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().optional().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().optional().default('/dashboard'),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),

  // Context7 / Upstash
  CONTEXT7_ENABLED: z.enum(['0', '1']).optional(),
  CONTEXT7_API_KEY: z.string().optional(),

  // Rollbar monitoring (opt-in via token presence)
  ROLLBAR_HEMERA_SERVER_TOKEN_1766674885: z.string().optional(),
  NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN_1766674885: z.string().optional(),
  ROLLBAR_ENABLED: z.enum(['0', '1']).optional(),
  NEXT_PUBLIC_ROLLBAR_ENABLED: z.enum(['0', '1']).optional(),

  // Upstash Redis rate limiting (opt-in via UPSTASH_ENABLED=1)
  UPSTASH_ENABLED: z.enum(['0', '1']).optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

type Env = z.infer<typeof EnvSchema>;

function buildEnvFromProcess(): Record<string, unknown> {
  // Map process.env values (strings) into shape expected by zod.
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    // Context7
    CONTEXT7_ENABLED: process.env.CONTEXT7_ENABLED,
    CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY,
    // Rollbar
    ROLLBAR_HEMERA_SERVER_TOKEN_1766674885: process.env.ROLLBAR_HEMERA_SERVER_TOKEN_1766674885,
    NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN_1766674885: process.env.NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN_1766674885,
    ROLLBAR_ENABLED: process.env.ROLLBAR_ENABLED,
    NEXT_PUBLIC_ROLLBAR_ENABLED: process.env.NEXT_PUBLIC_ROLLBAR_ENABLED,
    // Upstash
    UPSTASH_ENABLED: process.env.UPSTASH_ENABLED,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

const parseResult = EnvSchema.safeParse(buildEnvFromProcess());

if (!parseResult.success) {
  // Fail fast with a clear error during startup — report via Rollbar if available.
  try {
    reportError(new Error('Environment validation failed'), {
      additionalData: parseResult.error.format(),
    });
  } catch {
    // swallow reporting errors
  }

  throw new Error('Environment validation failed; aborting startup');
}

export const env: Env = parseResult.data;

export default env;
