'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import { colors } from '@/lib/design-tokens';

export interface CTASectionProps {
  /** Headline (German) */
  headline: string;
  /** Subheadline (informal "Du") */
  subheadline: string;
  /** CTA button text */
  ctaText: string;
  /** CTA link */
  ctaHref: string;
}

export default function CTASection({
  headline,
  subheadline,
  ctaText,
  ctaHref,
}: CTASectionProps) {
  return (
    <Box
      component='section'
      data-testid='cta-section'
      sx={{
        bgcolor: colors.marsala,
        py: { xs: 8, md: 10 },
      }}
    >
      <Container maxWidth='md'>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant='h2'
            component='h2'
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              color: colors.beige,
              mb: 2,
            }}
          >
            {headline}
          </Typography>

          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: colors.beige,
              opacity: 0.9,
              mb: 4,
              maxWidth: '500px',
              mx: 'auto',
            }}
          >
            {subheadline}
          </Typography>

          <Button
            href={ctaHref}
            variant='contained'
            size='large'
            sx={{
              bgcolor: colors.white,
              color: colors.marsala,
              fontWeight: 600,
              px: 5,
              py: 1.5,
              fontSize: '1.125rem',
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': {
                bgcolor: colors.beige,
              },
            }}
          >
            {ctaText}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
