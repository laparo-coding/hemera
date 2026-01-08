/**
 * TestimonialsSection Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Testimonials with success indicators on dark background.
 */

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import type React from 'react';
import { colors, spacing, typography } from '../../lib/design-tokens';

export interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  successIndicator: string;
}

export interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

// Placeholder testimonials for MVP
const PLACEHOLDER_TESTIMONIALS: Testimonial[] = [
  {
    id: 'testimonial-1',
    quote:
      'Nach dem Kurs habe ich meine erste Gehaltsverhandlung erfolgreich geführt und 15% mehr bekommen!',
    authorName: 'Lisa M.',
    authorRole: 'Senior Manager',
    successIndicator: 'Gehaltssteigerung von 15%',
  },
  {
    id: 'testimonial-2',
    quote:
      'Die Techniken haben mir geholfen, selbstbewusster in schwierigen Gesprächen aufzutreten. Absolut empfehlenswert!',
    authorName: 'Thomas K.',
    authorRole: 'Projektleiter',
    successIndicator: 'Beförderung nach 3 Monaten',
  },
  {
    id: 'testimonial-3',
    quote:
      'Ein Kurs, der wirklich etwas verändert hat. Ich kann jetzt viel besser mit Kunden verhandeln.',
    authorName: 'Sandra B.',
    authorRole: 'Teamleiterin',
    successIndicator: 'Bessere Kundengespräche',
  },
];

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonials,
}) => {
  // Use placeholder if no testimonials provided
  const displayTestimonials =
    testimonials.length > 0 ? testimonials : PLACEHOLDER_TESTIMONIALS;

  // Don't render if no testimonials
  if (displayTestimonials.length === 0) {
    return null;
  }

  return (
    <Box
      component='section'
      data-testid='testimonials-section'
      aria-labelledby='testimonials-title'
      sx={{
        backgroundColor: colors.petrol,
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
            color: colors.cream,
            mb: 5,
            textAlign: 'center',
          }}
        >
          Das sagen unsere Teilnehmerinnen
        </Typography>

        {/* Testimonial Cards */}
        <Grid container spacing={4}>
          {displayTestimonials.map(testimonial => (
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
                      color: colors.gold,
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
                      color: colors.petrol,
                      mb: 3,
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{testimonial.quote}&rdquo;
                  </Typography>

                  {/* Author */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant='subtitle1'
                      sx={{
                        fontFamily: typography.body,
                        fontWeight: 600,
                        color: colors.petrol,
                      }}
                    >
                      {testimonial.authorName}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{
                        fontFamily: typography.body,
                        color: colors.sage,
                      }}
                    >
                      {testimonial.authorRole}
                    </Typography>
                  </Box>

                  {/* Success Indicator */}
                  <Box
                    data-testid='success-indicator'
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      backgroundColor: colors.cream,
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                    }}
                  >
                    <CheckCircleIcon
                      sx={{ color: colors.gold, fontSize: 20 }}
                    />
                    <Typography
                      variant='body2'
                      sx={{
                        fontFamily: typography.body,
                        fontWeight: 500,
                        color: colors.petrol,
                      }}
                    >
                      {testimonial.successIndicator}
                    </Typography>
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

export default TestimonialsSection;
