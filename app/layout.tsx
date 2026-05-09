import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type * as React from 'react';
import Providers from '../components/Providers';
import { getClerkKeyMismatchReason } from '../lib/auth/clerk-key-validation';
import { SITE_CONFIG } from '../lib/seo/constants';
import { isEnvFlagEnabled } from '../lib/utils/env-flags';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const isE2E =
  isEnvFlagEnabled(process.env.E2E_TEST) ||
  isEnvFlagEnabled(process.env.NEXT_PUBLIC_DISABLE_CLERK);
const clerkBypassReason = getClerkKeyMismatchReason(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  process.env.CLERK_SECRET_KEY
);

if (clerkBypassReason && process.env.NODE_ENV !== 'test') {
  // biome-ignore lint/suspicious/noConsole: startup configuration errors must be visible in server logs
  console.error(`[auth] ${clerkBypassReason}`);
}

export const metadata: Metadata = {
  title: {
    template: `%s - ${SITE_CONFIG.name}`,
    default: SITE_CONFIG.name,
  },
  description: SITE_CONFIG.description,
  metadataBase: new URL(SITE_CONFIG.url),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='de' suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers isE2E={isE2E} clerkBypassReason={clerkBypassReason}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
