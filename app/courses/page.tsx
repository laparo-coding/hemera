import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type { CourseCardProps } from '../../components/landing';
import CourseCard from '../../components/landing/CourseCard';
import { getPublishedCourses } from '../../lib/api/courses';
import { getLevelLabel } from '../../lib/utils/course-level';

// Force dynamic rendering since we fetch courses from DB
export const dynamic = 'force-dynamic';

// Map database level to UI level indicator
function mapLevelToIndicator(
  level: string | null | undefined,
  index: number
): 'A' | 'B' | 'C' {
  if (level === 'BEGINNER') return 'A';
  if (level === 'INTERMEDIATE') return 'B';
  if (level === 'ADVANCED') return 'C';
  // Fallback based on position
  return (['A', 'B', 'C'] as const)[index % 3] || 'A';
}

// Format time from Date object
function formatTime(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return new Date(date).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  });
}

export default async function CoursesPage() {
  let courses: CourseCardProps[] = [];
  let fetchError: Error | null = null;

  try {
    const dbCourses = await getPublishedCourses();

    if (dbCourses.length > 0) {
      // Transform database courses to CourseCardProps
      courses = dbCourses.map((course, index) => ({
        courseId: course.slug,
        level: mapLevelToIndicator(course.level, index),
        levelLabel: getLevelLabel(course.level),
        title: course.title,
        description: course.description || '',
        upcomingDates: course.startDate
          ? [
              {
                date: new Date(course.startDate),
                formattedDate: new Date(course.startDate).toLocaleDateString(
                  'de-DE',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }
                ),
                startTime: formatTime(course.startTime),
                endTime: formatTime(course.endTime),
                availableSpots: course.availableSpots ?? undefined,
              },
            ]
          : [],
        detailHref: `/courses/${course.slug}`,
        ctaText: 'Mehr erfahren',
        location: course.location
          ? {
              name: course.location.name,
              slug: course.location.slug,
              city: course.location.city,
            }
          : undefined,
        thumbnailUrl: course.thumbnailUrl,
      }));
    }
  } catch (err) {
    if (process.env.E2E_TEST === 'true') {
      console.warn('[CoursesPage] getPublishedCourses failed in E2E mode', err);
    } else {
      console.error('[CoursesPage] Failed to fetch courses:', err);
      fetchError = err instanceof Error ? err : new Error('Unbekannter Fehler');
    }
  }

  return (
    <main>
      {/* Hero Section */}
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

      {/* Courses Grid */}
      <Box
        component='section'
        data-testid='course-overview'
        sx={{ py: { xs: 6, md: 8 }, bgcolor: '#FBF5DD' }}
      >
        <Container maxWidth='lg'>
          {/* Error State */}
          {fetchError && (
            <Box
              textAlign='center'
              sx={{
                py: 8,
                px: 4,
                bgcolor: 'rgba(211, 47, 47, 0.08)',
                borderRadius: 2,
                border: '1px solid rgba(211, 47, 47, 0.3)',
              }}
              data-testid='courses-error'
            >
              <Typography
                variant='h6'
                sx={{ color: '#d32f2f', mb: 2 }}
                gutterBottom
              >
                Kurse konnten nicht geladen werden
              </Typography>
              <Typography
                variant='body1'
                sx={{ color: '#16404D', opacity: 0.8 }}
              >
                Bitte versuche es später erneut oder kontaktiere uns, falls das
                Problem weiterhin besteht.
              </Typography>
            </Box>
          )}

          {/* Empty State (no error, just no courses) */}
          {!fetchError && courses.length === 0 && (
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

          {/* Courses Grid */}
          {!fetchError && courses.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(3, 1fr)',
                },
                gap: { xs: 4, md: 4 },
                alignItems: 'stretch',
              }}
            >
              {courses.map(course => (
                <Box key={course.courseId} data-testid='course-card'>
                  <CourseCard {...course} />
                </Box>
              ))}
            </Box>
          )}
        </Container>
      </Box>
    </main>
  );
}
