export type Env = {
  NODE_ENV: 'development' | 'test' | 'production';
  NEXT_PUBLIC_APP_URL?: string;
  DATABASE_URL?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  NEXT_PUBLIC_CLERK_SIGN_IN_URL?: string;
  NEXT_PUBLIC_CLERK_SIGN_UP_URL?: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL?: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL?: string;
};

function getEnv(): Env {
  return {
    NODE_ENV: (process.env.NODE_ENV as Env['NODE_ENV']) || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
  };
}

export const env = getEnv();
