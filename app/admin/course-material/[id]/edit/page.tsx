/**
 * Course Material Edit Page
 * Feature: 023-slide-editor
 *
 * Edit an existing course material (title, identifier, HTML content).
 */

import { Box, Typography } from '@mui/material';
import EditCourseMaterialClient from './edit-client';

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
