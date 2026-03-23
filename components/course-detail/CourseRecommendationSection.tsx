/**
 * CourseRecommendationSection Component
 *
 * Feature: 021-learning-path
 * Displays course prerequisites/recommendations with visual indicators.
 *
 * - "Das sind passende Voraussetzungen für das Seminar" (recommended)
 * - "Das sind keine passenden Voraussetzungen für das Seminar" (notRecommended)
 */

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import type React from 'react';
import { colors, spacing, typography } from '../../lib/design-tokens';

export interface CourseRecommendationSectionProps {
  /** Passende Voraussetzungen für das Seminar */
  recommended?: string | null;
  /** Keine passenden Voraussetzungen für das Seminar */
  notRecommended?: string | null;
}

export const CourseRecommendationSection: React.FC<
  CourseRecommendationSectionProps
> = ({ recommended, notRecommended }) => {
  // Don't render if neither field has content
  if (!recommended && !notRecommended) {
    return null;
  }

  return (
    <Box
      component='section'
      data-testid='recommendation-section'
      aria-labelledby='recommendation-title'
      sx={{
        backgroundColor: colors.beige,
        py: spacing.sectionPy,
      }}
    >
      <Container maxWidth={spacing.containerMaxWidth}>
        <Typography
          id='recommendation-title'
          variant='h2'
          component='h2'
          sx={{
            fontFamily: typography.heading,
            fontSize: { xs: '1.75rem', md: '2rem' },
            fontWeight: 700,
            color: colors.marsala,
            mb: 4,
            textAlign: 'center',
          }}
        >
          Voraussetzungen
        </Typography>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          justifyContent='center'
          alignItems='stretch'
          sx={{ maxWidth: '900px', mx: 'auto' }}
        >
          {/* Passende Voraussetzungen */}
          {recommended && (
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                backgroundColor: colors.white,
                borderRadius: 3,
                p: { xs: 3, md: 4 },
                borderLeft: `4px solid ${colors.success}`,
              }}
            >
              <Stack direction='row' spacing={1.5} alignItems='flex-start'>
                <CheckCircleOutlineIcon
                  sx={{
                    color: colors.success,
                    fontSize: '1.5rem',
                    mt: 0.25,
                    flexShrink: 0,
                  }}
                  aria-hidden='true'
                />
                <Box>
                  <Typography
                    variant='h6'
                    component='h3'
                    sx={{
                      fontFamily: typography.heading,
                      fontWeight: 600,
                      color: colors.marsala,
                      mb: 1,
                      fontSize: { xs: '1rem', md: '1.125rem' },
                    }}
                  >
                    Das sind passende Voraussetzungen für das Seminar
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{
                      fontFamily: typography.body,
                      color: colors.lightBlack,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {recommended}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Keine passenden Voraussetzungen */}
          {notRecommended && (
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                backgroundColor: colors.white,
                borderRadius: 3,
                p: { xs: 3, md: 4 },
                borderLeft: `4px solid ${colors.warning}`,
              }}
            >
              <Stack direction='row' spacing={1.5} alignItems='flex-start'>
                <WarningAmberIcon
                  sx={{
                    color: colors.warning,
                    fontSize: '1.5rem',
                    mt: 0.25,
                    flexShrink: 0,
                  }}
                  aria-hidden='true'
                />
                <Box>
                  <Typography
                    variant='h6'
                    component='h3'
                    sx={{
                      fontFamily: typography.heading,
                      fontWeight: 600,
                      color: colors.marsala,
                      mb: 1,
                      fontSize: { xs: '1rem', md: '1.125rem' },
                    }}
                  >
                    Das sind keine passenden Voraussetzungen für das Seminar
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{
                      fontFamily: typography.body,
                      color: colors.lightBlack,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {notRecommended}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
};
