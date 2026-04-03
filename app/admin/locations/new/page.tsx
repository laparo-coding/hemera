/**
 * Admin Create New Location Page (Server Component)
 * Feature: 015-course-locations
 * Task: T037
 *
 * Note: Admin authentication is handled by the parent layout.
 * This page follows the Server Component + Client Child pattern.
 */

import {
  Box,
  Breadcrumbs,
  Container,
  Link as MuiLink,
  Typography,
} from '@mui/material';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import NewLocationForm from './NewLocationForm';

export const metadata: Metadata = {
  title: 'Neue Location erstellen | Admin',
  description: 'Neuen Kursstandort hinzufügen',
};

export default function NewLocationPage() {
  return (
    <Container maxWidth='md' sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink
          component={NextLink}
          href='/admin'
          underline='hover'
          color='text.primary'
        >
          Admin
        </MuiLink>
        <MuiLink
          component={NextLink}
          href='/admin/locations'
          underline='hover'
          color='text.primary'
        >
          Locations
        </MuiLink>
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
