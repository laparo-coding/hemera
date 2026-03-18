'use client';

import { Box, Container, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { colors, typography } from '@/lib/design-tokens';

export interface ConceptFeature {
  icon?: ReactNode;
  title: string;
  description: string;
}

export interface ConceptSectionProps {
  /** Section ID for anchor navigation */
  id?: string;
  /** Headline (German) */
  headline: string;
  /** Main text blocks (informal "Du") */
  paragraphs: string[];
  /** Optional: Highlight box */
  highlight?: {
    title: string;
    text: string;
  };
  /** Optional: Feature list */
  features?: ConceptFeature[];
}

export default function ConceptSection({
  id = 'konzept',
  headline,
  paragraphs,
  highlight,
  features,
}: ConceptSectionProps) {
  return (
    <Box
      component='section'
      id={id}
      data-testid='concept-section'
      sx={{
        bgcolor: colors.beige,
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth='lg'>
        <Typography
          variant='h2'
          component='h2'
          sx={{
            fontFamily: typography.heading,
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 700,
            color: colors.marsala,
            textAlign: 'center',
            mb: 4,
          }}
        >
          {headline}
        </Typography>

        <Box sx={{ maxWidth: '700px', mx: 'auto', mb: highlight ? 5 : 0 }}>
          {paragraphs.map((paragraph, index) => (
            <Typography
              key={index}
              sx={{
                fontFamily: typography.body,
                fontSize: '1.125rem',
                lineHeight: 1.8,
                color: colors.lightBlack,
                mb: 3,
                textAlign: 'center',
              }}
            >
              {paragraph}
            </Typography>
          ))}
        </Box>

        {highlight && (
          <Paper
            elevation={0}
            sx={{
              bgcolor: colors.rosyBrown,
              p: { xs: 3, md: 4 },
              borderRadius: '12px',
              maxWidth: '600px',
              mx: 'auto',
              mb: features ? 6 : 0,
            }}
          >
            <Typography
              variant='h3'
              sx={{
                fontFamily: typography.heading,
                fontSize: '1.5rem',
                fontWeight: 600,
                color: colors.marsala,
                mb: 1,
              }}
            >
              {highlight.title}
            </Typography>
            <Typography
              sx={{
                fontFamily: typography.body,
                fontSize: '1rem',
                lineHeight: 1.6,
                color: colors.lightBlack,
              }}
            >
              {highlight.text}
            </Typography>
          </Paper>
        )}

        {features && features.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 4,
              mt: 4,
            }}
          >
            {features.map((feature, index) => (
              <Box
                key={index}
                sx={{
                  textAlign: 'center',
                  p: 3,
                }}
              >
                {feature.icon && (
                  <Box sx={{ color: colors.bronze, mb: 2, fontSize: '2.5rem' }}>
                    {feature.icon}
                  </Box>
                )}
                <Typography
                  variant='h4'
                  sx={{
                    fontFamily: typography.heading,
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: colors.marsala,
                    mb: 1,
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: typography.body,
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    color: colors.lightBlack,
                    opacity: 0.85,
                  }}
                >
                  {feature.description}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}
