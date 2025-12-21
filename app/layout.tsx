import type { Metadata } from 'next';
import type * as React from 'react';
import BuildInfo from '../components/BuildInfo';
import Providers from '../components/Providers';
import { inter } from '../lib/fonts';
import { SITE_CONFIG } from '../lib/seo/constants';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: `%s - ${SITE_CONFIG.name}`,
    default: SITE_CONFIG.name,
  },
  description: SITE_CONFIG.description,
  metadataBase: new URL(SITE_CONFIG.url),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isE2E =
    process.env.E2E_TEST === 'true' ||
    process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';

  return (
    <html lang='de' suppressHydrationWarning>
      <body className={inter.className}>
        <Providers isE2E={isE2E}>{children}</Providers>
        <BuildInfo />
      </body>
    </html>
  );
}
