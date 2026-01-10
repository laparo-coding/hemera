/**
 * CourseHeroSection Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Hero section with Mux video player or fallback image.
 * Priority: 1) Mux Video, 2) Thumbnail Image, 3) Nothing
 */

'use client';

import { Box, Skeleton } from '@mui/material';
import type { MuxPlayerCSSProperties } from '@mux/mux-player-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
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
  fallbackImageUrl: string | null;
  courseId: string;
  courseSlug: string;
  onBookingClick?: () => void;
}

export const CourseHeroSection: React.FC<CourseHeroSectionProps> = ({
  title,
  heroVideoPlaybackId,
  fallbackImageUrl,
}) => {
  // Priority: 1) Mux Video, 2) Thumbnail Image, 3) Nothing
  const hasVideo = Boolean(heroVideoPlaybackId);
  const hasImage = Boolean(fallbackImageUrl);

  // Don't render if no video and no image
  if (!hasVideo && !hasImage) {
    return null;
  }

  return (
    <Box
      component='section'
      data-testid='hero-section'
      aria-label={hasVideo ? `Kursvideo: ${title}` : `Kursbild: ${title}`}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        maxHeight: '70vh',
        overflow: 'hidden',
        backgroundColor: colors.petrol,
      }}
    >
      {hasVideo ? (
        <MuxPlayer
          playbackId={heroVideoPlaybackId!}
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
      ) : (
        <Image
          src={fallbackImageUrl!}
          alt={title}
          fill
          priority
          className='object-cover'
          sizes='100vw'
          data-testid='hero-image'
        />
      )}
    </Box>
  );
};

export default CourseHeroSection;
