import { Box, Button, Container, Typography } from '@mui/material';
import { colors, typography } from '@/lib/design-tokens';

export interface HeroSectionProps {
  /** Headline - core message (German) */
  headline: string;
  /** Subheadline - supporting text (informal "Du") */
  subheadline: string;
  /** Primary CTA button text */
  ctaPrimaryText: string;
  /** Primary CTA link (anchor to courses) */
  ctaPrimaryHref: string;
  /** Optional secondary CTA text */
  ctaSecondaryText?: string;
  /** Secondary CTA link (anchor to concept) */
  ctaSecondaryHref?: string;
}

export default function HeroSection({
  headline,
  subheadline,
  ctaPrimaryText,
  ctaPrimaryHref,
  ctaSecondaryText,
  ctaSecondaryHref,
}: HeroSectionProps) {
  return (
    <Box
      component='section'
      data-testid='hero-section'
      sx={{
        minHeight: '80vh',
        bgcolor: colors.beige,
        color: colors.marsala,
        display: 'flex',
        alignItems: 'center',
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth='lg'>
        <Box
          sx={{
            maxWidth: '800px',
            mx: 'auto',
            textAlign: 'center',
          }}
        >
          <Typography
            variant='h1'
            component='h1'
            sx={{
              fontFamily: typography.heading,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              lineHeight: 1.2,
              mb: 3,
            }}
          >
            {headline}
          </Typography>

          <Typography
            variant='h2'
            component='p'
            sx={{
              fontFamily: typography.body,
              fontSize: { xs: '1.125rem', md: '1.375rem' },
              fontWeight: 400,
              lineHeight: 1.6,
              mb: 5,
              opacity: 0.9,
            }}
          >
            {subheadline}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
            }}
          >
            <Button
              href={ctaPrimaryHref}
              variant='contained'
              color='primary'
              size='large'
              sx={{
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none',
                borderRadius: '8px',
              }}
            >
              {ctaPrimaryText}
            </Button>

            {ctaSecondaryText && ctaSecondaryHref && (
              <Button
                href={ctaSecondaryHref}
                variant='outlined'
                color='primary'
                size='large'
                sx={{
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderRadius: '8px',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                {ctaSecondaryText}
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
