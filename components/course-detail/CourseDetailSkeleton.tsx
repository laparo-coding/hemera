/**
 * CourseDetailSkeleton Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Loading skeleton for the course detail page to prevent CLS.
 */

import { Box, Container, Grid, Paper, Skeleton } from '@mui/material';
import type React from 'react';
import { colors, spacing } from '../../lib/design-tokens';

export const CourseDetailSkeleton: React.FC = () => {
  return (
    <Box>
      {/* Hero Section Skeleton */}
      <Box
        sx={{
          minHeight: { xs: '70vh', md: '80vh' },
          backgroundColor: colors.petrol,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Skeleton
          variant='rounded'
          width={60}
          height={36}
          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
        />
        <Skeleton
          variant='text'
          width='60%'
          height={80}
          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
        />
        <Skeleton
          variant='text'
          width='40%'
          height={40}
          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
        />
        <Skeleton
          variant='rounded'
          width={180}
          height={50}
          sx={{ bgcolor: 'rgba(255,255,255,0.1)', mt: 2 }}
        />
      </Box>

      {/* Overview Section Skeleton */}
      <Box sx={{ backgroundColor: colors.cream, py: spacing.sectionPy }}>
        <Container maxWidth={spacing.containerMaxWidth}>
          <Box sx={{ textAlign: 'center' }}>
            <Skeleton
              variant='text'
              width='30%'
              height={50}
              sx={{ mx: 'auto', mb: 3 }}
            />
            <Skeleton variant='text' width='80%' sx={{ mx: 'auto' }} />
            <Skeleton variant='text' width='70%' sx={{ mx: 'auto' }} />
            <Skeleton variant='text' width='75%' sx={{ mx: 'auto', mb: 4 }} />

            <Paper
              elevation={0}
              sx={{
                backgroundColor: colors.white,
                borderRadius: 3,
                p: 4,
                maxWidth: '700px',
                mx: 'auto',
              }}
            >
              <Skeleton variant='text' width='40%' height={40} sx={{ mb: 2 }} />
              {[1, 2, 3, 4].map(i => (
                <Box
                  key={i}
                  sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                >
                  <Skeleton
                    variant='circular'
                    width={24}
                    height={24}
                    sx={{ mr: 2 }}
                  />
                  <Skeleton variant='text' width='70%' />
                </Box>
              ))}
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* Curriculum Section Skeleton */}
      <Box sx={{ backgroundColor: colors.white, py: spacing.sectionPy }}>
        <Container maxWidth={spacing.containerMaxWidth}>
          <Skeleton
            variant='text'
            width='25%'
            height={50}
            sx={{ mx: 'auto', mb: 4 }}
          />
          <Paper
            elevation={2}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              maxWidth: '900px',
              mx: 'auto',
            }}
          >
            {[1, 2].map(i => (
              <Box
                key={i}
                sx={{ p: 3, borderBottom: `1px solid ${colors.lightGray}` }}
              >
                <Skeleton variant='text' width='50%' height={32} />
              </Box>
            ))}
          </Paper>
        </Container>
      </Box>

      {/* Pricing Section Skeleton */}
      <Box sx={{ backgroundColor: colors.sage, py: spacing.sectionPy }}>
        <Container maxWidth={spacing.containerMaxWidth}>
          <Skeleton
            variant='text'
            width='30%'
            height={50}
            sx={{ mx: 'auto', mb: 4 }}
          />
          <Grid container spacing={4} justifyContent='center'>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: colors.white,
                  borderRadius: 3,
                  p: 4,
                  height: 250,
                }}
              >
                {[1, 2, 3].map(i => (
                  <Box
                    key={i}
                    sx={{ display: 'flex', alignItems: 'center', mb: 3 }}
                  >
                    <Skeleton
                      variant='circular'
                      width={28}
                      height={28}
                      sx={{ mr: 2 }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant='text' width='30%' height={16} />
                      <Skeleton variant='text' width='60%' height={24} />
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: colors.petrol,
                  borderRadius: 3,
                  p: 4,
                  height: 250,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Skeleton
                  variant='text'
                  width='40%'
                  height={24}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                />
                <Skeleton
                  variant='text'
                  width='60%'
                  height={60}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                />
                <Skeleton
                  variant='rounded'
                  width={200}
                  height={50}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', mt: 2 }}
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section Skeleton */}
      <Box sx={{ backgroundColor: colors.petrol, py: spacing.sectionPy }}>
        <Container maxWidth={spacing.containerMaxWidth}>
          <Skeleton
            variant='text'
            width='40%'
            height={50}
            sx={{ mx: 'auto', mb: 4, bgcolor: 'rgba(255,255,255,0.1)' }}
          />
          <Grid container spacing={4}>
            {[1, 2, 3].map(i => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: colors.white,
                    borderRadius: 3,
                    p: 4,
                    height: 300,
                  }}
                >
                  <Skeleton
                    variant='circular'
                    width={40}
                    height={40}
                    sx={{ mb: 2 }}
                  />
                  <Skeleton variant='text' width='100%' />
                  <Skeleton variant='text' width='90%' />
                  <Skeleton variant='text' width='80%' sx={{ mb: 3 }} />
                  <Skeleton variant='text' width='40%' />
                  <Skeleton variant='text' width='30%' sx={{ mb: 2 }} />
                  <Skeleton variant='rounded' width='80%' height={36} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default CourseDetailSkeleton;
