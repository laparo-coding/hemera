import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/dashboard'),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),

  // Context7 / Upstash
  CONTEXT7_ENABLED: z.enum(['0', '1']).optional(),
  CONTEXT7_API_KEY: z.string().optional(),

  // Rollbar monitoring (opt-in via token presence)
  ROLLBAR_HEMERA_SERVER_TOKEN: z.string().optional(),
  NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN: z.string().optional(),
  ROLLBAR_ENABLED: z.enum(['0', '1']).optional(),
  NEXT_PUBLIC_ROLLBAR_ENABLED: z.enum(['0', '1']).optional(),

  // Upstash Redis rate limiting (opt-in via UPSTASH_ENABLED=1)
  UPSTASH_ENABLED: z.enum(['0', '1']).optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

type Env = z.infer<typeof EnvSchema>;

function buildEnvFromProcess(): Record<string, unknown> {
  // Pick all keys defined in the schema from process.env automatically.
  const schemaKeys = Object.keys(EnvSchema.shape) as Array<
    keyof typeof EnvSchema.shape
  >;
  const result: Record<string, unknown> = {};
  for (const key of schemaKeys) {
    result[key] = process.env[key];
  }
  return result;
}

const parseResult = EnvSchema.safeParse(buildEnvFromProcess());

if (!parseResult.success) {
  // Fail fast with a clear error during startup — report via Rollbar if available.
  // Use lazy dynamic import to avoid circular dependency (env.ts ← rollbar-official.ts ← env.ts).
  try {
    // Log only the field names that failed validation, never the values themselves
    const fieldErrors = Object.keys(parseResult.error.format()).filter(
      k => k !== '_errors'
    );
    // biome-ignore lint/suspicious/noConsole: intentional fallback when Rollbar is not yet available
    console.error(
      '[env] Environment validation failed for fields:',
      fieldErrors
    );
    // Attempt async Rollbar report (non-blocking)
    import('./monitoring/rollbar-official')
      .then(({ reportError }) => {
        reportError(new Error('Environment validation failed'), {
          additionalData: { failedFields: fieldErrors },
        });
      })
      .catch(() => {
        /* Rollbar not available */
      });
  } catch (_reportErr) {
    // Rollbar not available yet — already logged to stderr above
  }

  throw new Error('Environment validation failed; aborting startup');
}

export const env: Env = parseResult.data;

export default env;
