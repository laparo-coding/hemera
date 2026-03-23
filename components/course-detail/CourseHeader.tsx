/**
 * CourseHeader Component
 *
 * Static header section displayed at the top of every course detail page.
 * Shows course title, level badge, and optional thumbnail.
 */

import { Box, Chip, Container, Typography } from '@mui/material';
import type React from 'react';
import { colors, spacing, typography } from '../../lib/design-tokens';

export interface CourseHeaderProps {
  title: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tagline?: string;
  thumbnailUrl?: string | null;
}

const LEVEL_LABELS: Record<CourseHeaderProps['level'], string> = {
  BEGINNER: 'Basis',
  INTERMEDIATE: 'Fortgeschrittene',
  ADVANCED: 'Masterclass',
};

const LEVEL_COLORS: Record<CourseHeaderProps['level'], string> = {
  BEGINNER: colors.rosyBrown,
  INTERMEDIATE: colors.bronze,
  ADVANCED: colors.marsala,
};

export const CourseHeader: React.FC<CourseHeaderProps> = ({
  title,
  level,
  tagline,
  thumbnailUrl,
}) => {
  const levelLabel = LEVEL_LABELS[level] || level;
  const levelColor = LEVEL_COLORS[level] || colors.marsala;

  return (
    <Box
      component='header'
      data-testid='course-header'
      id='course-top'
      sx={{
        backgroundColor: colors.beige,
        pt: { xs: 10, md: 12 }, // Account for fixed navigation
        pb: spacing.sectionPy,
        position: 'relative',
        scrollMarginTop: { xs: '80px', md: '88px' }, // Offset for fixed nav when scrolling to this element
      }}
    >
      <Container maxWidth={spacing.containerMaxWidth}>
        {/* Thumbnail Image */}
        {thumbnailUrl && (
          <Box
            sx={{
              width: '100%',
              mb: 4,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(22, 64, 77, 0.15)',
            }}
          >
            <Box
              component='img'
              src={thumbnailUrl}
              alt={title}
              sx={{
                width: '100%',
                height: 'auto',
                aspectRatio: '16 / 9',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </Box>
        )}

        {/* Level Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Chip
            label={levelLabel}
            size='small'
            sx={{
              backgroundColor: `${levelColor}20`,
              color: colors.marsala,
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 1,
            }}
          />
        </Box>

        {/* Course Title */}
        <Typography
          variant='h1'
          component='h1'
          sx={{
            fontFamily: typography.heading,
            fontSize: { xs: '2rem', md: '3rem' },
            fontWeight: 700,
            color: colors.marsala,
            textAlign: 'center',
            mb: tagline ? 2 : 0,
          }}
        >
          {title}
        </Typography>

        {/* Optional Tagline */}
        {tagline && (
          <Typography
            variant='subtitle1'
            sx={{
              fontFamily: typography.body,
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              color: colors.marsala,
              opacity: 0.85,
              textAlign: 'center',
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            {tagline}
          </Typography>
        )}
      </Container>
    </Box>
  );
};

export default CourseHeader;
