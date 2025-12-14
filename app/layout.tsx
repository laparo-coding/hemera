import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type * as React from 'react';
import BuildInfo from '../components/BuildInfo';
import Providers from '../components/Providers';
import { SITE_CONFIG } from '../lib/seo/constants';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s - Hemera Academy',
    default: 'Hemera Academy',
  },
  description:
    'Transform your career with expert-led courses in technology, business, and creative skills.',
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
