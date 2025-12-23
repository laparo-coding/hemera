/**
 * Public Location Page Loading State
 * Feature: 015-course-locations
 */

import { Box, Container, Grid, Paper, Skeleton } from '@mui/material';

export default function LocationLoading() {
  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      {/* Hero Image Skeleton */}
      <Skeleton
        variant='rectangular'
        height={300}
        sx={{ mb: 4, borderRadius: 2 }}
      />

      {/* Title Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant='text' width={350} height={56} />
        <Skeleton variant='text' width={200} height={32} sx={{ mb: 2 }} />
        <Skeleton variant='text' width='100%' />
        <Skeleton variant='text' width='80%' />
      </Box>

      <Grid container spacing={4}>
        {/* Map Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Skeleton variant='text' width={120} height={32} sx={{ mb: 1 }} />
            <Skeleton
              variant='rectangular'
              height={300}
              sx={{ borderRadius: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Skeleton
                variant='rectangular'
                width={140}
                height={36}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant='rectangular'
                width={140}
                height={36}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar Skeleton */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant='text' width={160} height={32} sx={{ mb: 2 }} />
            <Skeleton variant='rectangular' height={1} sx={{ mb: 2 }} />

            {[1, 2, 3, 4].map(i => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Skeleton variant='circular' width={24} height={24} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant='text' width={80} height={20} />
                  <Skeleton variant='text' width='100%' height={24} />
                </Box>
              </Box>
            ))}

            <Skeleton variant='rectangular' height={1} sx={{ my: 2 }} />
            <Skeleton
              variant='rectangular'
              height={42}
              sx={{ borderRadius: 1 }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
