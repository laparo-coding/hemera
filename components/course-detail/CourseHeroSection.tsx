/**
 * CourseHeroSection Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Hero section with Mux video player - only shown when heroVideoPlaybackId exists.
 */

'use client';

import { Box, Skeleton } from '@mui/material';
import MuxPlayer from '@mux/mux-player-react';
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
  heroVideoPlaybackId,
}) => {
  // Only render if there's a Mux video playback ID
  if (!heroVideoPlaybackId) {
    return null;
  }

  return (
    <Box
      component='section'
      data-testid='hero-section'
      aria-label={`Kursvideo: ${title}`}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        maxHeight: '70vh',
        overflow: 'hidden',
        backgroundColor: colors.petrol,
      }}
    >
      <MuxPlayer
        playbackId={heroVideoPlaybackId}
        streamType='on-demand'
        autoPlay='muted'
        muted
        loop
        playsInline
        style={
          {
            width: '100%',
            height: '100%',
            '--controls': 'none',
          } as React.CSSProperties
        }
      />
    </Box>
  );
};

export default CourseHeroSection;
