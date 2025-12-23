/**
 * Admin Locations List Page
 * Feature: 015-course-locations
 * Task: T036
 */

import { auth } from '@clerk/nextjs/server';
import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, Container, Skeleton, Typography } from '@mui/material';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { listLocations } from '@/lib/services/location';
import LocationsTableClient from './LocationsTableClient';

export const metadata = {
  title: 'Locations verwalten | Admin',
  description: 'Kursstandorte erstellen und verwalten',
};

async function LocationsContent() {
  const locations = await listLocations();

  return <LocationsTableClient locations={locations} />;
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

export default async function AdminLocationsPage() {
  const { sessionClaims } = await auth();

  // Admin authorization
  if (sessionClaims?.metadata?.role !== 'admin') {
    redirect('/dashboard');
  }

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
        <Button
          component={Link}
          href='/admin/locations/new'
          variant='contained'
          startIcon={<AddIcon />}
        >
          Neue Location
        </Button>
      </Box>

      <Suspense fallback={<LocationsSkeleton />}>
        <LocationsContent />
      </Suspense>
    </Container>
  );
}
