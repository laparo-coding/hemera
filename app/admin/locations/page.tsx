/**
 * Admin Locations List Page
 * Feature: 015-course-locations
 * Task: T036
 */

import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Skeleton } from '@mui/material';
import Link from 'next/link';
import { Suspense } from 'react';
import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { ADMIN_LABELS } from '@/lib/constants/admin';
import { listLocations } from '@/lib/services/location';
import LocationsTableClient from './LocationsTableClient';

export const metadata = {
  title: 'Locations verwalten | Admin',
  description: 'Kursstandorte erstellen und verwalten',
};

export const dynamic = 'force-dynamic';

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
    <AdminPageContainer
      title={ADMIN_LABELS.locations}
      subtitle='Verwalte Kursstandorte und Veranstaltungsorte'
      breadcrumbs={[
        { label: ADMIN_LABELS.locations, href: '/admin/locations' },
      ]}
      titleProps={{ 'data-testid': 'admin-locations-page' }}
      actions={
        <Link href='/admin/locations/new' style={{ textDecoration: 'none' }}>
          <Button variant='contained' startIcon={<AddIcon />}>
            Neuer Veranstaltungsort
          </Button>
        </Link>
      }
    >
      <Suspense fallback={<LocationsSkeleton />}>
        <LocationsContent />
      </Suspense>
    </AdminPageContainer>
  );
}
