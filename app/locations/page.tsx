/**
 * Public Locations List Page
 * Feature: 015-course-locations
 */

import { Place as PlaceIcon } from '@mui/icons-material';
import { Box, Container, Grid, Typography } from '@mui/material';
import type { Metadata } from 'next';
import LocationCard from '@/components/LocationCard';
import { listLocations } from '@/lib/services/location';

export const metadata: Metadata = {
  title: 'Kursstandorte | Hemera Academy',
  description: 'Entdecke unsere Kursstandorte und Veranstaltungsorte',
};

export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
  const result = await listLocations();

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <PlaceIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant='h3' component='h1' gutterBottom>
          Unsere Standorte
        </Typography>
        <Typography
          variant='body1'
          color='text.secondary'
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Entdecke unsere Kursstandorte und finde den perfekten Ort für deine
          Weiterbildung.
        </Typography>
      </Box>

      {result.locations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant='h6' color='text.secondary'>
            Derzeit sind keine Standorte verfügbar.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {result.locations.map(location => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={location.id}>
              <LocationCard location={location} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
