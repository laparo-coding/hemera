/**
 * DatesPricingSection Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Displays course dates, pricing, and location with booking CTA.
 */

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EuroIcon from '@mui/icons-material/Euro';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Box, Container, Paper, Typography } from '@mui/material';
import type React from 'react';
import { TERMS } from '../../lib/constants';
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
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(price / 100);
  } catch {
    // Fallback for invalid currency codes
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price / 100);
  }
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
          Termin & Preis
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          {/* Details Card - Centered */}
          <Paper
            elevation={0}
            sx={{
              backgroundColor: colors.white,
              borderRadius: 3,
              p: { xs: 3, md: 4 },
              boxShadow: shadows.card,
              maxWidth: 500,
              width: '100%',
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

            {/* Price */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
              <EuroIcon sx={{ color: colors.gold, mr: 2, fontSize: 28 }} />
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
                  {TERMS.courseFee}
                </Typography>
                <Typography
                  variant='h6'
                  sx={{
                    fontFamily: typography.body,
                    fontWeight: 600,
                    color: colors.petrol,
                  }}
                >
                  {formatPrice(price, currency)} inkl. 19% MwSt.
                </Typography>
              </Box>
            </Box>

            {/* CTA Button */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <BookingCTA
                courseId={courseId}
                courseSlug={courseSlug}
                variant='primary'
                price={price}
                currency={currency}
                label='Jetzt buchen'
              />
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default DatesPricingSection;
