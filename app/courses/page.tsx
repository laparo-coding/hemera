import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Container,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedCourses } from '../../lib/api/courses';
import { generateCourseListMetadata } from '../../lib/seo/metadata';
import { SCHEMA_COMBINATIONS } from '../../lib/seo/schemas';

export const metadata: Metadata = generateCourseListMetadata();
// Force dynamic rendering to ensure freshly seeded courses are visible immediately
export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  // Robust gegen fehlende DB im internen E2E: Fehler abfangen und Empty-State rendern
  let courses: Awaited<ReturnType<typeof getPublishedCourses>> = [];
  try {
    courses = await getPublishedCourses();
  } catch (err) {
    // Wenn wir im E2E-Testmodus laufen und die DB nicht verfügbar ist,
    // rendere den Empty-State statt mit einem Dev-Error-Overlay abzubrechen.
    if (process.env.E2E_TEST === 'true') {
      console.warn('[CoursesPage] getPublishedCourses failed in E2E mode', err);
      courses = [];
    } else {
      throw err;
    }
  }

  const jsonLdSchemas = SCHEMA_COMBINATIONS.courseList(courses);
  return (
    <>
      {jsonLdSchemas.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}

      <main>
        <Box
          component='section'
          sx={{
            bgcolor: '#FBF5DD',
            color: '#16404D',
            py: { xs: 10, md: 14 },
            textAlign: 'center',
          }}
        >
          <Container maxWidth='lg'>
            <Typography
              variant='h1'
              component='h1'
              gutterBottom
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 700,
                mb: 3,
                lineHeight: 1.2,
                color: '#16404D',
              }}
            >
              Alle Kurse
            </Typography>
            <Typography
              variant='h2'
              component='h2'
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: { xs: '1.125rem', md: '1.375rem' },
                fontWeight: 400,
                opacity: 0.9,
                maxWidth: '600px',
                mx: 'auto',
                color: '#16404D',
              }}
            >
              Entdecke unser komplettes Angebot an praxisnahen Kursen
            </Typography>
          </Container>
        </Box>

        <Box
          component='section'
          data-testid='course-overview'
          sx={{ py: { xs: 6, md: 8 }, bgcolor: '#FBF5DD' }}
        >
          <Container maxWidth='lg'>
            {courses.length > 0 ? (
              <Grid container spacing={4}>
                {courses.map(course => {
                  const isSoldOut =
                    typeof course.availableSpots === 'number' &&
                    course.capacity !== null &&
                    course.capacity !== undefined &&
                    course.availableSpots === 0;

                  const courseHref = `/courses/${course.slug || course.id}`;

                  return (
                    <Grid item xs={12} md={6} lg={4} key={course.id}>
                      <Link
                        href={courseHref}
                        style={{ textDecoration: 'none' }}
                      >
                        <Card
                          data-testid='course-card'
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: '#FFFFFF',
                            border: '1px solid rgba(22, 64, 77, 0.1)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 12px 24px rgba(22, 64, 77, 0.1)',
                            },
                          }}
                        >
                          <CardActionArea
                            sx={{
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'stretch',
                            }}
                          >
                            {/* Course Image */}
                            <Box
                              sx={{
                                position: 'relative',
                                height: 160,
                                bgcolor: '#16404D',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                              }}
                            >
                              {course.thumbnailUrl ? (
                                <CardMedia
                                  component='img'
                                  height='160'
                                  image={course.thumbnailUrl}
                                  alt={course.title}
                                  sx={{
                                    objectFit: 'cover',
                                    width: '100%',
                                    height: '100%',
                                  }}
                                />
                              ) : (
                                <Typography
                                  variant='h4'
                                  sx={{
                                    color: '#FFFFFF',
                                    fontFamily: '"Playfair Display", serif',
                                    fontWeight: 700,
                                  }}
                                >
                                  {course.title.charAt(0)}
                                </Typography>
                              )}
                              {/* Sold out badge */}
                              {isSoldOut && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    bgcolor: '#DDA853',
                                    color: '#16404D',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    boxShadow: 2,
                                    zIndex: 1,
                                  }}
                                  data-testid='sold-out-badge'
                                >
                                  Ausgebucht
                                </Box>
                              )}
                            </Box>

                            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                              <Typography
                                variant='h6'
                                component='h3'
                                gutterBottom
                                data-testid='course-title'
                                sx={{
                                  fontFamily: '"Playfair Display", serif',
                                  fontSize: '1.25rem',
                                  fontWeight: 700,
                                  color: '#16404D',
                                  mb: 1,
                                }}
                              >
                                {course.title}
                              </Typography>

                              <Typography
                                variant='body2'
                                paragraph
                                data-testid='course-description'
                                sx={{
                                  fontFamily: '"Inter", sans-serif',
                                  fontSize: '0.875rem',
                                  lineHeight: 1.6,
                                  color: '#16404D',
                                  opacity: 0.85,
                                }}
                              >
                                {course.description &&
                                course.description.length > 100
                                  ? `${course.description.substring(0, 100)}...`
                                  : course.description ||
                                    'Keine Beschreibung verfügbar'}
                              </Typography>

                              <Typography
                                variant='body2'
                                sx={{
                                  mb: 2,
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  fontSize: '0.75rem',
                                  color: '#16404D',
                                }}
                                data-testid='course-level'
                              >
                                {course.level === 'BEGINNER'
                                  ? 'Basis'
                                  : course.level === 'INTERMEDIATE'
                                    ? 'Fortgeschrittene'
                                    : 'Masterclass'}
                              </Typography>

                              {/* Location */}
                              {course.location && (
                                <Typography
                                  variant='body2'
                                  sx={{
                                    mb: 2,
                                    fontSize: '0.875rem',
                                    color: '#16404D',
                                    opacity: 0.7,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  📍 {course.location.name},{' '}
                                  {course.location.city}
                                </Typography>
                              )}

                              {/* Instructor */}
                              {course.instructor && (
                                <Typography
                                  variant='body2'
                                  sx={{
                                    mb: 2,
                                    fontSize: '0.875rem',
                                    color: '#16404D',
                                    opacity: 0.7,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  👤 {course.instructor}
                                </Typography>
                              )}

                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mt: 2,
                                }}
                              >
                                <Typography
                                  variant='body2'
                                  sx={{
                                    fontFamily: '"Inter", sans-serif',
                                    color: '#16404D',
                                    opacity: 0.7,
                                  }}
                                >
                                  8 Stunden
                                </Typography>
                                <Typography
                                  variant='h6'
                                  component='span'
                                  sx={{
                                    fontWeight: 700,
                                    color: '#DDA853',
                                    fontFamily: '"Inter", sans-serif',
                                  }}
                                >
                                  {course.price && Number(course.price) > 0
                                    ? (() => {
                                        const euros =
                                          Number(course.price) / 100;
                                        return euros.toLocaleString('de-DE', {
                                          style: 'currency',
                                          currency: 'EUR',
                                          minimumFractionDigits:
                                            Number.isInteger(euros) ? 0 : 2,
                                          maximumFractionDigits: 2,
                                        });
                                      })()
                                    : 'Kostenlos'}
                                </Typography>
                              </Box>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Link>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Box
                textAlign='center'
                sx={{ py: 8 }}
                data-testid='e2e-courses-empty'
              >
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  Bald verfügbar!
                </Typography>
                <Typography variant='body1' color='text.secondary'>
                  Neue Kurse kommen bald. Bleib dran für spannende
                  Lernmöglichkeiten.
                </Typography>
              </Box>
            )}
          </Container>
        </Box>
      </main>
    </>
  );
}
