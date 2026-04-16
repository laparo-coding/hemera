'use client';

/**
 * DynamicTestimonialsSection Component
 *
 * Feature: 017-testimonial-management
 * Loads and displays testimonials from database via API.
 * Falls back gracefully when no testimonials are available.
 */

import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type {
  CourseTestimonialsApiResponse,
  PublicTestimonialApiResponse,
} from '@/lib/types/testimonial';
import { getAvatarInitial } from '@/lib/utils/avatar';
import { formatMonthYear } from '@/lib/utils/date-format';
import { colors, spacing, typography } from '../../lib/design-tokens';

export interface DynamicTestimonialsSectionProps {
  courseSlug: string;
  limit?: number;
}

export const DynamicTestimonialsSection: React.FC<
  DynamicTestimonialsSectionProps
> = ({ courseSlug, limit = 6 }) => {
  const [testimonials, setTestimonials] = useState<
    PublicTestimonialApiResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTestimonials() {
      const normalizedCourseSlug = courseSlug.trim();

      if (!normalizedCourseSlug) {
        setTestimonials([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null); // Clear previous errors
        const response = await fetch(
          `/api/courses/${encodeURIComponent(normalizedCourseSlug)}/testimonials?limit=${limit}`
        );

        if (!response.ok) {
          if (response.status === 400 || response.status === 404) {
            setTestimonials([]);
            return;
          }
          throw new Error('Fehler beim Laden');
        }

        const data: CourseTestimonialsApiResponse = await response.json();
        setTestimonials(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonials();
  }, [courseSlug, limit]);

  // Don't render section if no testimonials and not loading
  if (!loading && testimonials.length === 0) {
    return null;
  }

  // Show skeleton loading state instead of blocking spinner
  if (loading) {
    return null; // Don't block render while loading testimonials
  }

  // Don't render if there was an error (fail silently)
  if (error) {
    return null;
  }

  return (
    <Box
      component='section'
      data-testid='dynamic-testimonials-section'
      aria-labelledby='testimonials-title'
      sx={{
        backgroundColor: colors.marsala,
        py: spacing.sectionPy,
      }}
    >
      <Container maxWidth={spacing.containerMaxWidth}>
        {/* Section Title */}
        <Typography
          id='testimonials-title'
          variant='h2'
          component='h2'
          sx={{
            fontFamily: typography.heading,
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 700,
            color: colors.beige,
            mb: 5,
            textAlign: 'center',
          }}
        >
          Das sagen unsere Teilnehmer
        </Typography>

        {/* Testimonial Cards */}
        <Grid container spacing={4}>
          {testimonials.map(testimonial => (
            <Grid size={{ xs: 12, md: 4 }} key={testimonial.id}>
              <Card
                data-testid='testimonial-card'
                sx={{
                  backgroundColor: colors.white,
                  borderRadius: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: { xs: 3, md: 4 } }}>
                  {/* Quote Icon */}
                  <FormatQuoteIcon
                    data-testid='quote-icon'
                    sx={{
                      color: colors.bronze,
                      fontSize: 40,
                      mb: 2,
                      transform: 'scaleX(-1)',
                    }}
                  />

                  {/* Quote Text */}
                  <Typography
                    variant='body1'
                    sx={{
                      fontFamily: typography.body,
                      fontSize: '1.1rem',
                      lineHeight: 1.7,
                      color: colors.lightBlack,
                      mb: 3,
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{testimonial.statement}&rdquo;
                  </Typography>

                  {/* Author */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mt: 'auto',
                    }}
                  >
                    <Avatar
                      src={testimonial.photoUrl || undefined}
                      alt={testimonial.displayName}
                      sx={{ width: 48, height: 48 }}
                    >
                      {getAvatarInitial(testimonial.displayName)}
                    </Avatar>
                    <Box>
                      <Typography
                        variant='subtitle2'
                        sx={{
                          fontFamily: typography.body,
                          fontWeight: 700,
                          color: colors.marsala,
                        }}
                      >
                        {testimonial.displayName}
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{
                          color: colors.lightGray,
                        }}
                      >
                        {formatMonthYear(testimonial.createdAt) ?? ''}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default DynamicTestimonialsSection;
