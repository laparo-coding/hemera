'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Container, Typography } from '@mui/material';
import { colors } from '@/lib/design-tokens';
import CourseCard, { type CourseCardProps } from './CourseCard';

export interface CourseProgressionSectionProps {
  /** Section ID for anchor navigation */
  id?: string;
  /** Section headline (German) */
  headline: string;
  /** Subheadline (informal "Du") */
  subheadline?: string;
  /** Array of three courses in order A, B, C */
  courses: CourseCardProps[];
  /** Show progression arrows between courses */
  showProgression?: boolean;
}

export default function CourseProgressionSection({
  id = 'kurse',
  headline,
  subheadline,
  courses,
  showProgression = true,
}: CourseProgressionSectionProps) {
  const hasCourses = courses.length > 0;

  return (
    <Box
      component='section'
      id={id}
      data-testid='course-progression-section'
      sx={{
        bgcolor: colors.beige,
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth='lg'>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant='h2'
            component='h2'
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              color: colors.marsala,
              mb: 2,
            }}
          >
            {headline}
          </Typography>

          {subheadline && (
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '1.125rem',
                lineHeight: 1.6,
                color: colors.lightBlack,
                opacity: 0.85,
                maxWidth: '600px',
                mx: 'auto',
              }}
            >
              {subheadline}
            </Typography>
          )}
        </Box>

        {/* Course cards with optional progression arrows */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: showProgression ? 'repeat(5, 1fr)' : 'repeat(3, 1fr)',
            },
            gap: { xs: 4, md: showProgression ? 2 : 4 },
            alignItems: 'stretch',
          }}
        >
          {hasCourses ? (
            courses.map((course, index) => (
              <Box
                key={course.courseId}
                sx={{
                  gridColumn: showProgression
                    ? {
                        xs: 'span 1',
                        md: index === 0 ? '1' : index === 1 ? '3' : '5',
                      }
                    : 'span 1',
                }}
              >
                <CourseCard {...course} />
              </Box>
            ))
          ) : (
            <Box
              data-testid='course-database-empty'
              sx={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                py: 6,
              }}
            >
              <Typography
                variant='h6'
                sx={{ color: colors.marsala, mb: 1 }}
                gutterBottom
              >
                Aktuell sind keine veroeffentlichten Seminare in der Datenbank
                verfuegbar.
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  color: colors.lightBlack,
                  opacity: 0.8,
                }}
              >
                Sobald Seminare veroeffentlicht sind, erscheinen sie hier
                automatisch aus der Datenbank.
              </Typography>
            </Box>
          )}

          {/* Progression arrows (desktop only) */}
          {showProgression && hasCourses && (
            <>
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  gridColumn: '2',
                  gridRow: '1',
                }}
              >
                <ArrowForwardIcon
                  aria-hidden='true'
                  sx={{
                    fontSize: '2.5rem',
                    color: colors.bronze,
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  gridColumn: '4',
                  gridRow: '1',
                }}
              >
                <ArrowForwardIcon
                  aria-hidden='true'
                  sx={{
                    fontSize: '2.5rem',
                    color: colors.bronze,
                  }}
                />
              </Box>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}
