/**
 * CourseHeroSection Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Hero section with Mux video player or fallback image.
 */

'use client';

import { Box, Chip, Container, Skeleton, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type React from 'react';
import {
  colors,
  courseLevelColors,
  shadows,
  spacing,
  typography,
  zIndex,
} from '../../lib/design-tokens';
import { BookingCTA } from './BookingCTA';

// Dynamic import MuxPlayer to avoid SSR issues
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <Skeleton
        variant='rectangular'
        width='100%'
        height='100%'
        sx={{ position: 'absolute', top: 0, left: 0 }}
      />
    ),
  }
);

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
  level,
  tagline,
  heroVideoPlaybackId,
  fallbackImageUrl,
  courseId,
  courseSlug,
  onBookingClick,
}) => {
  const levelStyle = courseLevelColors[level];

  return (
    <Box
      component='section'
      data-testid='hero-section'
      aria-label={`Kurs: ${title}`}
      sx={{
        position: 'relative',
        minHeight: { xs: '70vh', md: '80vh' },
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Background: Video or Image */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      >
        {heroVideoPlaybackId ? (
          <MuxPlayer
            data-testid='mux-player'
            playbackId={heroVideoPlaybackId}
            autoPlay='muted'
            muted
            loop
            playsInline
            style={
              {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                '--controls': 'none',
              } as Record<string, string>
            }
          />
        ) : fallbackImageUrl ? (
          <Image
            src={fallbackImageUrl}
            alt={title}
            fill
            priority
            style={{ objectFit: 'cover' }}
          />
        ) : (
          // Gradient fallback
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${colors.petrol} 0%, ${colors.sage} 100%)`,
            }}
          />
        )}
      </Box>

      {/* Dark overlay for text readability */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: shadows.heroOverlay,
          zIndex: zIndex.heroOverlay,
        }}
      />

      {/* Content */}
      <Container
        maxWidth={spacing.containerMaxWidth}
        sx={{
          position: 'relative',
          zIndex: zIndex.heroContent,
          textAlign: 'center',
          color: colors.white,
        }}
      >
        {/* Level Badge */}
        <Chip
          label={levelStyle.label}
          sx={{
            backgroundColor: levelStyle.bg,
            color: levelStyle.text,
            fontFamily: typography.body,
            fontWeight: 700,
            fontSize: '1rem',
            px: 2,
            py: 2.5,
            mb: 3,
          }}
        />

        {/* Title */}
        <Typography
          variant='h1'
          component='h1'
          sx={{
            fontFamily: typography.heading,
            fontSize: { xs: '2.5rem', md: '4rem' },
            fontWeight: 700,
            lineHeight: 1.1,
            mb: 2,
            color: colors.white,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {title}
        </Typography>

        {/* Tagline */}
        {tagline && (
          <Typography
            variant='h5'
            component='p'
            sx={{
              fontFamily: typography.body,
              fontSize: { xs: '1.1rem', md: '1.5rem' },
              fontWeight: 400,
              mb: 4,
              color: colors.cream,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            {tagline}
          </Typography>
        )}

        {/* CTA Button */}
        <Box onClick={onBookingClick}>
          <BookingCTA
            courseId={courseId}
            courseSlug={courseSlug}
            variant='primary'
          />
        </Box>
      </Container>
    </Box>
  );
};

export default CourseHeroSection;
