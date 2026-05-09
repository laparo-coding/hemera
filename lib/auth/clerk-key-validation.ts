type ClerkKeyMode = 'test' | 'live';

function getPublishableKeyMode(key?: string): ClerkKeyMode | null {
  if (!key) {
    return null;
  }

  if (key.startsWith('pk_test_')) {
    return 'test';
  }

  if (key.startsWith('pk_live_')) {
    return 'live';
  }

  return null;
}

function getSecretKeyMode(key?: string): ClerkKeyMode | null {
  if (!key) {
    return null;
  }

  if (key.startsWith('sk_test_')) {
    return 'test';
  }

  if (key.startsWith('sk_live_')) {
    return 'live';
  }

  return null;
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

  return `Clerk deaktiviert: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (${publishableMode}) und CLERK_SECRET_KEY (${secretMode}) passen nicht zusammen.`;
}
