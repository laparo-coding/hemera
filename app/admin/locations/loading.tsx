/**
 * Admin Locations Loading State
 * Feature: 015-course-locations
 */

import { Box, Container, Skeleton } from '@mui/material';

export default function AdminLocationsLoading() {
  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Skeleton variant='text' width={200} height={48} />
          <Skeleton variant='text' width={300} height={24} />
        </Box>
        <Skeleton
          variant='rectangular'
          width={150}
          height={40}
          sx={{ borderRadius: 1 }}
        />
      </Box>

      <Skeleton
        variant='rectangular'
        height={56}
        sx={{ mb: 2, borderRadius: 1 }}
      />
      <Skeleton variant='rectangular' height={400} sx={{ borderRadius: 1 }} />
    </Container>
  );
}
