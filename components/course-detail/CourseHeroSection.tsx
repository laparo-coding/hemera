/**
 * CourseHeroSection Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Hero section with Mux video player.
 * Only renders when a video is available.
 */

'use client';

import { Box, Skeleton } from '@mui/material';
import type { MuxPlayerCSSProperties } from '@mux/mux-player-react';
import dynamic from 'next/dynamic';
import type React from 'react';
import { colors } from '../../lib/design-tokens';

// Dynamic import with SSR disabled to prevent hydration issues
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), {
  ssr: false,
  loading: () => (
    <Skeleton
      variant='rectangular'
      sx={{ width: '100%', height: '100%', bgcolor: colors.petrol }}
    />
  ),
});

export interface CourseHeroSectionProps {
  title: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tagline?: string;
  heroVideoPlaybackId: string | null;
  courseId: string;
  courseSlug: string;
  onBookingClick?: () => void;
}

export const CourseHeroSection: React.FC<CourseHeroSectionProps> = ({
  title,
  heroVideoPlaybackId,
}) => {
  // Only render when video is available
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
          } satisfies MuxPlayerCSSProperties
        }
      />
    </Box>
  );
};

export default CourseHeroSection;
