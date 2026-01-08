/**
 * DatesPricingSection Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Displays course dates, pricing, and location with booking CTA.
 */

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import type React from 'react';
import { colors, shadows, spacing, typography } from '../../lib/design-tokens';
import { BookingCTA } from './BookingCTA';

export interface DatesPricingSectionProps {
  price: number;
  currency: string;
  startDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  location: {
    name: string;
    city: string;
  } | null;
  courseId: string;
  courseSlug: string;
}

/**
 * Format price in German locale with EUR symbol
 */
function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(price / 100);
}

/**
 * Format date in German locale
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format time in HH:MM format
 */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export const DatesPricingSection: React.FC<DatesPricingSectionProps> = ({
  price,
  currency,
  startDate,
  startTime,
  endTime,
  location,
  courseId,
  courseSlug,
}) => {
  return (
    <Box
      component='section'
      data-testid='pricing-section'
      aria-labelledby='pricing-title'
      sx={{
        backgroundColor: colors.sage,
        py: spacing.sectionPy,
      }}
    >
      <Container maxWidth={spacing.containerMaxWidth}>
        {/* Section Title */}
        <Typography
          id='pricing-title'
          variant='h2'
          component='h2'
          sx={{
            fontFamily: typography.heading,
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 700,
            color: colors.petrol,
            mb: 5,
            textAlign: 'center',
          }}
        >
          Termine & Preise
        </Typography>

        <Grid container spacing={4} justifyContent='center'>
          {/* Details Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                backgroundColor: colors.white,
                borderRadius: 3,
                p: { xs: 3, md: 4 },
                boxShadow: shadows.card,
                height: '100%',
              }}
            >
              {/* Date */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CalendarTodayIcon
                  sx={{ color: colors.gold, mr: 2, fontSize: 28 }}
                />
                <Box>
                  <Typography
                    variant='caption'
                    sx={{
                      fontFamily: typography.body,
                      color: colors.sage,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Datum
                  </Typography>
                  <Typography
                    variant='h6'
                    sx={{
                      fontFamily: typography.body,
                      fontWeight: 600,
                      color: colors.petrol,
                    }}
                  >
                    {startDate
                      ? formatDate(startDate)
                      : 'Termin wird bekannt gegeben'}
                  </Typography>
                </Box>
              </Box>

              {/* Time */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccessTimeIcon
                  sx={{ color: colors.gold, mr: 2, fontSize: 28 }}
                />
                <Box>
                  <Typography
                    variant='caption'
                    sx={{
                      fontFamily: typography.body,
                      color: colors.sage,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Uhrzeit
                  </Typography>
                  <Typography
                    variant='h6'
                    sx={{
                      fontFamily: typography.body,
                      fontWeight: 600,
                      color: colors.petrol,
                    }}
                  >
                    {startTime && endTime
                      ? `${formatTime(startTime)} - ${formatTime(endTime)} Uhr`
                      : 'Wird bekannt gegeben'}
                  </Typography>
                </Box>
              </Box>

              {/* Location */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOnIcon
                  sx={{ color: colors.gold, mr: 2, fontSize: 28 }}
                />
                <Box>
                  <Typography
                    variant='caption'
                    sx={{
                      fontFamily: typography.body,
                      color: colors.sage,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Ort
                  </Typography>
                  <Typography
                    variant='h6'
                    sx={{
                      fontFamily: typography.body,
                      fontWeight: 600,
                      color: colors.petrol,
                    }}
                  >
                    {location
                      ? `${location.name}, ${location.city}`
                      : 'Ort wird bekannt gegeben'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Pricing Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                backgroundColor: colors.petrol,
                borderRadius: 3,
                p: { xs: 3, md: 4 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Typography
                variant='caption'
                sx={{
                  fontFamily: typography.body,
                  color: colors.sage,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  mb: 1,
                }}
              >
                Kursgebühr
              </Typography>
              <Typography
                variant='h2'
                sx={{
                  fontFamily: typography.heading,
                  fontWeight: 700,
                  color: colors.cream,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  mb: 1,
                }}
              >
                {formatPrice(price, currency)}
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  fontFamily: typography.body,
                  color: colors.sage,
                  mb: 4,
                }}
              >
                inkl. 19% MwSt.
              </Typography>
              <BookingCTA
                courseId={courseId}
                courseSlug={courseSlug}
                variant='primary'
                price={price}
                currency={currency}
                label='Jetzt buchen'
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DatesPricingSection;
