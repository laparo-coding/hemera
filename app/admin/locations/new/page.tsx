/**
 * Admin Create New Location Page (Server Component)
 * Feature: 015-course-locations
 * Task: T037
 *
 * Note: Admin authentication is handled by the parent layout.
 * This page follows the Server Component + Client Child pattern.
 */

import { Box, Breadcrumbs, Container, Typography } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import NewLocationForm from './NewLocationForm';

export const metadata: Metadata = {
  title: 'Neue Location erstellen | Admin',
  description: 'Neuen Kursstandort hinzufügen',
};

export default function NewLocationPage() {
  return (
    <Container maxWidth='md' sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          href='/admin'
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          Admin
        </Link>
        <Link
          href='/admin/locations'
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          Locations
        </Link>
        <Typography color='text.primary'>Neu</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 2 }}>
        <Typography variant='h4' component='h1' gutterBottom>
          Neue Location erstellen
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Füge einen neuen Kursstandort hinzu
        </Typography>
      </Box>

      <NewLocationForm />
    </Container>
  );
}
