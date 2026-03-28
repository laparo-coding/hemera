/**
 * Course Material Edit Page
 * Feature: 023-slide-editor
 *
 * Edit an existing course material (title, identifier, HTML content).
 */

import { Box, Typography } from '@mui/material';
import dynamic from 'next/dynamic';

const EditCourseMaterialClient = dynamic(() => import('./edit-client'), {
  ssr: false,
  loading: () => <div>Lade deinen Editor ...</div>,
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCourseMaterialPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Box>
      <Typography variant='h4' component='h1' gutterBottom>
        Seminarmaterial bearbeiten
      </Typography>
      <EditCourseMaterialClient id={id} />
    </Box>
  );
}
