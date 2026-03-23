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

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonials,
}) => {
  // Only render if real testimonials are provided (no placeholders on production)
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <Box
      component='section'
      data-testid='testimonials-section'
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
          Das sagen unsere Teilnehmerinnen
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
                    &ldquo;{testimonial.quote}&rdquo;
                  </Typography>

                  {/* Author */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant='subtitle1'
                      sx={{
                        fontFamily: typography.body,
                        fontWeight: 600,
                        color: colors.marsala,
                      }}
                    >
                      {testimonial.authorName}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{
                        fontFamily: typography.body,
                        color: colors.rosyBrown,
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
                      backgroundColor: colors.beige,
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                    }}
                  >
                    <CheckCircleIcon
                      sx={{ color: colors.bronze, fontSize: 20 }}
                    />
                    <Typography
                      variant='body2'
                      sx={{
                        fontFamily: typography.body,
                        fontWeight: 500,
                        color: colors.lightBlack,
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
