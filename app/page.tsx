import { Box, Button, Container, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getFeaturedCourses } from '@/lib/api/courses';
import { generateLandingPageMetadata } from '@/lib/seo/metadata';
import { SCHEMA_COMBINATIONS } from '@/lib/seo/schemas';

/**
 * Landing page with SSG and SEO optimization
 *
 * Features:
 * - Static generation for optimal performance
 * - SEO-optimized metadata and structured data
 * - Hero section with clear value proposition
 * - Featured courses overview
 * - Call-to-action registrationAus area
 */

export const metadata: Metadata = generateLandingPageMetadata();
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const _featuredCourses = await getFeaturedCourses(3);

  // For now, use homepage schema instead of landingPage
  const jsonLdSchemas = SCHEMA_COMBINATIONS.homepage();

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLdSchemas.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: Buffer.from(JSON.stringify(schema, null, 2)).toString(
              'base64'
            ),
          }}
        />
      ))}

      <main style={{ paddingTop: '64px' }}>
        {/* Hero Section */}
        <Box
          component='section'
          data-testid='hero-section'
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            py: { xs: 12, md: 16 },
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'linear-gradient(135deg, rgba(0,86,210,0.9) 0%, rgba(0,65,163,0.9) 100%)',
              zIndex: 1,
            },
          }}
        >
          <Container maxWidth='lg' sx={{ position: 'relative', zIndex: 2 }}>
            <Typography
              variant='h1'
              component='h1'
              gutterBottom
              sx={{
                fontSize: { xs: '3rem', md: '4.5rem' },
                fontWeight: 700,
                mb: 4,
                lineHeight: 1.1,
              }}
            >
              Transformiere deine Karriere mit
              <br />
              von Experten geleiteten Kursen
            </Typography>

            <Typography
              variant='h2'
              component='h2'
              sx={{
                fontSize: { xs: '1.25rem', md: '1.75rem' },
                fontWeight: 400,
                mb: 6,
                opacity: 0.95,
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.4,
              }}
            >
              Schließe dich tausenden von Studenten an, die ihre Karriere in
              Technologie, Business und kreativen Fähigkeiten mit Hemera Academy
              vorantreiben
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant='contained'
                color='secondary'
                size='large'
                href='/courses'
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
              >
                Kurse erkunden
              </Button>

              <Button
                variant='outlined'
                color='secondary'
                size='large'
                href='/sign-in'
                data-testid='hero-login-button'
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'secondary.main',
                    color: 'secondary.contrastText',
                  },
                }}
              >
                Anmelden
              </Button>
            </Box>
          </Container>
        </Box>

        {/* Registration CTA Section */}
        <Box
          component='section'
          data-testid='registration-area'
          sx={{
            bgcolor: 'grey.50',
            py: { xs: 8, md: 12 },
            borderTop: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Container maxWidth='md'>
            <Box textAlign='center'>
              <Typography
                variant='h2'
                component='h2'
                gutterBottom
                sx={{
                  fontSize: { xs: '2.5rem', md: '3rem' },
                  fontWeight: 700,
                  mb: 3,
                  color: 'text.primary',
                }}
              >
                Bereit zum Lernen?
              </Typography>

              <Typography
                variant='h3'
                component='h3'
                sx={{
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  color: 'text.secondary',
                  mb: 6,
                  lineHeight: 1.5,
                }}
              >
                Schließe dich unserer Lern-Community an und mache den nächsten
                Schritt in deiner Karriere
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant='contained'
                  color='primary'
                  size='large'
                  href='/sign-in'
                  sx={{
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    textTransform: 'none',
                  }}
                >
                  Jetzt starten
                </Button>

                <Button
                  variant='outlined'
                  color='primary'
                  size='large'
                  href='/courses'
                  sx={{
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    textTransform: 'none',
                  }}
                >
                  Kurse durchsuchen
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Footer */}
        <Box
          component='footer'
          sx={{
            bgcolor: 'grey.900',
            color: 'grey.300',
            py: 6,
          }}
        >
          <Container maxWidth='lg'>
            <Grid container spacing={4}>
              <Grid item xs={12} md={3}>
                <Typography
                  variant='h6'
                  sx={{ color: 'white', mb: 2, fontWeight: 600 }}
                >
                  Hemera Academy
                </Typography>
                <Typography variant='body2' sx={{ mb: 2 }}>
                  Transformiere deine Karriere mit von Experten geleiteten
                  Kursen in Technologie, Business und kreativen Fähigkeiten.
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography
                  variant='h6'
                  sx={{ color: 'white', mb: 2, fontWeight: 600 }}
                >
                  Courses
                </Typography>
                <Box component='ul' sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  <li>
                    <Link
                      href='/courses'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      Alle Kurse
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/courses?category=tech'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      Technologie
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/courses?category=business'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      Business
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/courses?category=design'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      Design
                    </Link>
                  </li>
                </Box>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography
                  variant='h6'
                  sx={{ color: 'white', mb: 2, fontWeight: 600 }}
                >
                  Support
                </Typography>
                <Box component='ul' sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  <li>
                    <Link
                      href='/help'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      Hilfe-Center
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/contact'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      Kontakt
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/faq'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/feedback'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      Feedback
                    </Link>
                  </li>
                </Box>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography
                  variant='h6'
                  sx={{ color: 'white', mb: 2, fontWeight: 600 }}
                >
                  Company
                </Typography>
                <Box component='ul' sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  <li>
                    <Link
                      href='/about'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      Über uns
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/careers'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      Karriere
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/press'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      Presse
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/investors'
                      style={{ color: 'grey.400', textDecoration: 'none' }}
                    >
                      Investoren
                    </Link>
                  </li>
                </Box>
              </Grid>
            </Grid>

            <Box
              sx={{
                borderTop: '1px solid grey.800',
                mt: 6,
                pt: 4,
                textAlign: 'center',
              }}
            >
              <Typography variant='body2' sx={{ color: 'grey.500' }}>
                © 2025 Hemera Academy. All rights reserved.
              </Typography>
            </Box>
          </Container>
        </Box>
      </main>
    </>
  );
}
