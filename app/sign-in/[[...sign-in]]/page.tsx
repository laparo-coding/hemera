import { SignInPageClient } from './SignInPageClient';

interface PageProps {
  searchParams: Promise<{ redirect_url?: string }>;
}

// Validate redirect URL to prevent open redirect attacks
function validateRedirectUrl(url: string | null): string {
  const defaultRedirect = '/dashboard';

  if (!url) return defaultRedirect;

  // Only allow relative paths starting with /
  if (!url.startsWith('/')) return defaultRedirect;

  // Prevent protocol-relative URLs (//evil.com)
  if (url.startsWith('//')) return defaultRedirect;

  // Prevent javascript: and other protocols
  if (url.includes(':')) return defaultRedirect;

  return url;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectUrl = validateRedirectUrl(params?.redirect_url ?? null);

  return <SignInPageClient redirectUrl={redirectUrl} />;
}
