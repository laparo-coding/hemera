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
  const isE2E =
    process.env.E2E_TEST === '1' ||
    process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';

  return (
    <html lang='de' suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers isE2E={isE2E}>{children}</Providers>
        <BuildInfo />
      </body>
    </html>
  );
}
