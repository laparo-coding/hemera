/**
 * Location Not Found Page
 * Feature: 015-course-locations
 */

import { Home as HomeIcon, Search as SearchIcon } from '@mui/icons-material';
import { Box, Button, Container, Typography } from '@mui/material';
import Link from 'next/link';

export default function LocationNotFound() {
  return (
    <Container maxWidth='sm' sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant='h1' sx={{ fontSize: '6rem', mb: 2 }}>
        404
      </Typography>
      <Typography variant='h4' gutterBottom>
        Location nicht gefunden
      </Typography>
      <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
        Die gesuchte Location existiert nicht oder wurde verschoben.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Link href='/'>
          <Button variant='contained' startIcon={<HomeIcon />}>
            Zur Startseite
          </Button>
        </Link>
        <Link href='/courses'>
          <Button variant='outlined' startIcon={<SearchIcon />}>
            Kurse durchsuchen
          </Button>
        </Link>
      </Box>
    </Container>
  );
}
