/**
 * Admin Locations List Page
 * Feature: 015-course-locations
 * Task: T036
 */

import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, Container, Skeleton, Typography } from '@mui/material';
import Link from 'next/link';
import { Suspense } from 'react';
import { listLocations } from '@/lib/services/location';
import LocationsTableClient from './LocationsTableClient';

export const metadata = {
  title: 'Locations verwalten | Admin',
  description: 'Kursstandorte erstellen und verwalten',
};

async function LocationsContent() {
  const result = await listLocations();

  return <LocationsTableClient locations={result.locations} />;
}

function LocationsSkeleton() {
  return (
    <Box>
      <Skeleton
        variant='rectangular'
        height={56}
        sx={{ mb: 2, borderRadius: 1 }}
      />
      <Skeleton variant='rectangular' height={400} sx={{ borderRadius: 1 }} />
    </Box>
  );
}

/**
 * Admin Locations Page
 *
 * Note: Admin authentication is handled by the parent layout.
 */
export default async function AdminLocationsPage() {
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
          <Typography variant='h4' component='h1' gutterBottom>
            Locations
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Verwalte Kursstandorte und Veranstaltungsorte
          </Typography>
        </Box>
        <Link href='/admin/locations/new'>
          <Button variant='contained' startIcon={<AddIcon />}>
            Neue Location
          </Button>
        </Link>
      </Box>

      <Suspense fallback={<LocationsSkeleton />}>
        <LocationsContent />
      </Suspense>
    </Container>
  );
}
