type ClerkKeyMode = 'test' | 'live';

function getKeyMode(
  key: string | undefined,
  prefixes: { test: string; live: string }
): ClerkKeyMode | null {
  if (!key) {
    return null;
  }

  if (key.startsWith(prefixes.test)) {
    return 'test';
  }

  if (key.startsWith(prefixes.live)) {
    return 'live';
  }

  return null;
}

function getPublishableKeyMode(key?: string): ClerkKeyMode | null {
  return getKeyMode(key, { test: 'pk_test_', live: 'pk_live_' });
}

function getSecretKeyMode(key?: string): ClerkKeyMode | null {
  return getKeyMode(key, { test: 'sk_test_', live: 'sk_live_' });
}

export function getClerkKeyMismatchReason(
  publishableKey?: string,
  secretKey?: string
): string | null {
  const publishableMode = getPublishableKeyMode(publishableKey);
  const secretMode = getSecretKeyMode(secretKey);

  if (!publishableMode || !secretMode) {
    return null;
  }

  if (publishableMode === secretMode) {
    return null;
  }

  return (
    'Clerk deaktiviert: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ' +
    `(${publishableMode}) und CLERK_SECRET_KEY (${secretMode}) ` +
    'passen nicht zusammen.'
  );
}
