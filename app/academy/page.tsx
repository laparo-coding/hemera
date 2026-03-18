import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getFullUrl,
  IMAGE_CONFIG,
  SITE_CONFIG,
  SOCIAL_CONFIG,
} from '../../lib/seo/constants';
import { SCHEMA_COMBINATIONS } from '../../lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Hemera Academy – Über unsere Seminare',
  description:
    'Erfahre mehr über die Hemera Academy: Ziele, Lernformate und wie du mit unseren Seminaren durchstartest.',
  openGraph: {
    title: 'Hemera Academy – Über unsere Seminare',
    description:
      'Erfahre mehr über die Hemera Academy: Ziele, Lernformate und wie du mit unseren Seminaren durchstartest.',
    url: `${SITE_CONFIG.url}/academy`,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: getFullUrl(IMAGE_CONFIG.og.default),
        width: IMAGE_CONFIG.og.width,
        height: IMAGE_CONFIG.og.height,
        alt: IMAGE_CONFIG.og.alt,
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hemera Academy – Über unsere Seminare',
    description:
      'Erfahre mehr über die Hemera Academy: Ziele, Lernformate und wie du mit unseren Seminaren durchstartest.',
    site: SOCIAL_CONFIG.twitter.site,
    creator: SOCIAL_CONFIG.twitter.creator,
    // Stelle sicher, dass Twitter ebenfalls eine absolute Bild-URL erhält
    // (Next.js setzt zwar metadataBase um, wir liefern hier aber explizit absolut aus)
    images: [getFullUrl(IMAGE_CONFIG.og.default)],
  },
};

export const dynamic = 'force-static';

export default function AcademyPage() {
  const jsonLdSchemas = SCHEMA_COMBINATIONS.academyPage();
  return (
    <>
      {jsonLdSchemas.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 2),
          }}
        />
      ))}

      <main className='min-h-screen bg-gray-50'>
        <header className='bg-white border-b border-gray-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center h-16'>
              <h1 className='text-xl font-semibold text-gray-900'>
                Hemera Academy
              </h1>
              <nav className='flex items-center space-x-6'>
                <a href='/' className='text-gray-600 hover:text-gray-900'>
                  Start
                </a>
                <a
                  href='/courses'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Alle Seminare
                </a>
              </nav>
            </div>
          </div>
        </header>

        <section className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
          <h2 className='text-3xl font-bold mb-4'>
            Lernen, das dich weiterbringt
          </h2>
          <p className='text-gray-700 leading-relaxed mb-6'>
            Die Hemera Academy bietet praxisnahe Seminare für Entwickler:innen
            und Tech-Professionals. Alle Inhalte sind auf Deutsch, Preise inkl.
            MwSt., und die Buchung erfolgt intern über dein Benutzerkonto.
          </p>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='font-semibold mb-2'>Praxisnah</h3>
              <p className='text-sm text-gray-600'>
                Aufgaben, Beispiele und Templates aus der realen
                Produktentwicklung.
              </p>
            </div>
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='font-semibold mb-2'>Deutsch & EUR</h3>
              <p className='text-sm text-gray-600'>
                Inhalte auf Deutsch, Preise in Euro (inkl. USt.).
              </p>
            </div>
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='font-semibold mb-2'>Transparente Buchung</h3>
              <p className='text-sm text-gray-600'>
                Buchung startest du auf der Kursdetailsseite – sicher und
                nachvollziehbar.
              </p>
            </div>
          </div>

          <div className='mt-10'>
            <Link
              href='/courses'
              className='inline-flex items-center px-5 py-3 rounded-md text-white hover:opacity-90'
              style={{ backgroundColor: 'var(--hemera-marsala)' }}
            >
              Seminare entdecken
              <svg
                className='ml-2 -mr-1 w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
