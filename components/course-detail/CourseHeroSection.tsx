/**
 * CourseHeroSection Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Hero section with video player placeholder.
 */

'use client';

import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { Box } from '@mui/material';
import type React from 'react';
import { colors } from '../../lib/design-tokens';

export interface CourseHeroSectionProps {
  title: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tagline?: string;
  heroVideoPlaybackId: string | null;
  fallbackImageUrl: string | null;
  courseId: string;
  courseSlug: string;
  onBookingClick?: () => void;
}

export const CourseHeroSection: React.FC<CourseHeroSectionProps> = ({
  title,
}) => {
  return (
    <Box
      component='section'
      data-testid='hero-section'
      aria-label={`Kurs: ${title}`}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        maxHeight: '70vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.petrol,
      }}
    >
      {/* Video Player Placeholder */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <PlayCircleOutlineIcon
          sx={{
            fontSize: { xs: 80, md: 120 },
            color: colors.cream,
            opacity: 0.8,
          }}
        />
      </Box>
    </Box>
  );
};

export default CourseHeroSection;
