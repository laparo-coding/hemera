'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Container, Typography } from '@mui/material';
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

// Design tokens from spec
const colors = {
  cream: '#FBF5DD',
  petrol: '#16404D',
  gold: '#DDA853',
};

export default function CourseProgressionSection({
  id = 'kurse',
  headline,
  subheadline,
  courses,
  showProgression = true,
}: CourseProgressionSectionProps) {
  return (
    <Box
      component='section'
      id={id}
      data-testid='course-progression-section'
      sx={{
        bgcolor: colors.cream,
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
              color: colors.petrol,
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
                color: colors.petrol,
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
          {courses.map((course, index) => (
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
          ))}

          {/* Progression arrows (desktop only) */}
          {showProgression && (
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
                  sx={{
                    fontSize: '2.5rem',
                    color: colors.gold,
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
                  sx={{
                    fontSize: '2.5rem',
                    color: colors.gold,
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
