'use client';

import { Box, Container, Skeleton, Stack } from '@mui/material';

/**
 * Loading state for the landing page
 * Feature: 012-performance-improvement (FR-007)
 *
 * Provides skeleton UI to prevent CLS during page load.
 * Matches the visual structure of the landing page.
 */
export default function Loading() {
  return (
    <main style={{ paddingTop: '64px' }}>
      {/* Hero Section Skeleton */}
      <Box
        component='section'
        sx={{
          bgcolor: 'primary.main',
          py: { xs: 12, md: 16 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth='lg'>
          <Stack spacing={4} alignItems='center'>
            {/* Title skeleton */}
            <Skeleton
              variant='text'
              width='80%'
              height={80}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
            />
            <Skeleton
              variant='text'
              width='60%'
              height={80}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
            />

            {/* Subtitle skeleton */}
            <Skeleton
              variant='text'
              width='50%'
              height={40}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
            />

            {/* CTA buttons skeleton */}
            <Stack direction='row' spacing={2} justifyContent='center'>
              <Skeleton
                variant='rounded'
                width={180}
                height={56}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
              />
              <Skeleton
                variant='rounded'
                width={180}
                height={56}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
              />
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Registration CTA Section Skeleton */}
      <Box
        component='section'
        sx={{
          bgcolor: 'grey.50',
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth='md'>
          <Stack spacing={3} alignItems='center'>
            <Skeleton variant='text' width='60%' height={60} />
            <Skeleton variant='text' width='80%' height={30} />
            <Stack direction='row' spacing={3} justifyContent='center'>
              <Skeleton variant='rounded' width={160} height={52} />
              <Skeleton variant='rounded' width={160} height={52} />
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Footer Skeleton */}
      <Box
        component='footer'
        sx={{
          bgcolor: 'grey.900',
          py: 6,
        }}
      >
        <Container maxWidth='lg'>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            justifyContent='space-between'
          >
            {[1, 2, 3, 4].map(i => (
              <Stack key={i} spacing={2} sx={{ flex: 1 }}>
                <Skeleton
                  variant='text'
                  width={120}
                  height={32}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                />
                <Skeleton
                  variant='text'
                  width='80%'
                  height={20}
                  sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                />
                <Skeleton
                  variant='text'
                  width='70%'
                  height={20}
                  sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                />
                <Skeleton
                  variant='text'
                  width='60%'
                  height={20}
                  sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                />
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>
    </main>
  );
}
