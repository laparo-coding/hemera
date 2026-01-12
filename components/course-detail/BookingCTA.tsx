/**
 * BookingCTA Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Reusable booking call-to-action with three variants.
 */

'use client';

import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import type React from 'react';
import { colors, typography } from '../../lib/design-tokens';

export interface BookingCTAProps {
  courseId: string;
  courseSlug: string;
  variant: 'primary' | 'secondary' | 'banner';
  price?: number;
  currency?: string;
  label?: string;
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

export const BookingCTA: React.FC<BookingCTAProps> = ({
  courseSlug,
  variant,
  price,
  currency = 'EUR',
  label,
}) => {
  const checkoutUrl = `/checkout?course=${courseSlug}`;
  const buttonLabel = label || 'Jetzt buchen';

  // Primary variant: Gold filled button
  if (variant === 'primary') {
    return (
      <Button
        component={Link}
        href={checkoutUrl}
        variant='contained'
        size='large'
        aria-label={
          price
            ? `${buttonLabel} für ${formatPrice(price, currency)}`
            : buttonLabel
        }
        sx={{
          backgroundColor: colors.gold,
          color: colors.petrol,
          fontFamily: typography.body,
          fontWeight: 600,
          px: 4,
          py: 1.5,
          borderRadius: 2,
          textTransform: 'none',
          fontSize: '1.1rem',
          '&:hover': {
            backgroundColor: '#C99742',
          },
        }}
      >
        {buttonLabel}
      </Button>
    );
  }

  // Secondary variant: Petrol outline button
  if (variant === 'secondary') {
    return (
      <Button
        component={Link}
        href={checkoutUrl}
        variant='outlined'
        size='large'
        aria-label={buttonLabel}
        sx={{
          borderColor: colors.petrol,
          color: colors.petrol,
          fontFamily: typography.body,
          fontWeight: 600,
          px: 4,
          py: 1.5,
          borderRadius: 2,
          textTransform: 'none',
          fontSize: '1rem',
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: 'rgba(22, 64, 77, 0.04)',
          },
        }}
      >
        {buttonLabel}
      </Button>
    );
  }

  // Banner variant: Full-width cream background
  return (
    <Box
      data-testid='booking-cta-banner'
      sx={{
        width: '100%',
        backgroundColor: colors.cream,
        py: { xs: 4, md: 6 },
        textAlign: 'center',
      }}
    >
      <Typography
        variant='h4'
        component='p'
        sx={{
          fontFamily: typography.heading,
          color: colors.petrol,
          mb: 3,
        }}
      >
        Bereit für den nächsten Schritt?
      </Typography>
      <Button
        component={Link}
        href={checkoutUrl}
        variant='contained'
        size='large'
        aria-label={
          price
            ? `Kurs buchen für ${formatPrice(price, currency)}`
            : 'Kurs buchen'
        }
        sx={{
          backgroundColor: colors.petrol,
          color: colors.cream,
          fontFamily: typography.body,
          fontWeight: 600,
          px: 6,
          py: 2,
          borderRadius: 2,
          textTransform: 'none',
          fontSize: '1.2rem',
          '&:hover': {
            backgroundColor: '#0D2A33',
          },
        }}
      >
        {buttonLabel}
      </Button>
    </Box>
  );
};

export default BookingCTA;
