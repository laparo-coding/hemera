import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ redirect_url?: string; returnUrl?: string }>;
}

export default async function CustomSignInRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const redirectUrl = params?.redirect_url || params?.returnUrl || undefined;

  const fallbackPath = '/sign-in';
  const rawBase = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim();
  const candidateBase = rawBase && rawBase.length > 0 ? rawBase : fallbackPath;
  const isAbsolute = /^https?:\/\//i.test(candidateBase);
  const normalizedCurrentPath = '/auth/custom-sign-in';

  let url: URL;

  if (isAbsolute) {
    url = new URL(candidateBase);
    const headerList = await headers();
    const protocol = headerList.get('x-forwarded-proto') ?? 'http';
    const host =
      headerList.get('x-forwarded-host') ??
      headerList.get('host') ??
      'localhost:3000';
    const currentOrigin = `${protocol}://${host}`;
    const normalizedPath = normalizePath(url.pathname);

    if (
      url.origin === currentOrigin &&
      normalizedPath === normalizedCurrentPath
    ) {
      url = new URL(fallbackPath, currentOrigin);
    }
  } else {
    const normalizedCandidate = normalizePath(candidateBase);
    const safePath =
      normalizedCandidate === normalizedCurrentPath
        ? fallbackPath
        : normalizedCandidate;
    url = new URL(safePath, 'http://localhost');
  }

  if (redirectUrl) {
    url.searchParams.set('redirect_url', redirectUrl);
  }

  const target = isAbsolute ? url.toString() : `${url.pathname}${url.search}`;

  redirect(target);
}

function normalizePath(pathname: string): string {
  if (!pathname.startsWith('/')) {
    return `/${pathname}`;
  }
  return pathname.replace(/\/+$/, '') || '/';
}
