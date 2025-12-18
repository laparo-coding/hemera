/**
 * Create Course Page
 *
 * Form for creating a new course
 * with validation and server action integration.
 */

'use client';

import { Alert, Box, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { z } from 'zod';
import CourseForm from '../../../../components/admin/CourseForm';
import { createCourseAction } from '../../../../lib/actions/admin/courses';
import type { courseCreateSchema } from '../../../../lib/schemas/admin/course';

type FormData = z.input<typeof courseCreateSchema>;

export default function NewCoursePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: FormData) => {
    setError(null);
    const result = await createCourseAction(data);

    if (result.success) {
      router.push('/admin');
      router.refresh();
    } else {
      setError(result.error || 'Failed to create course');
    }
  };

  return (
    <Box>
      <Typography variant='h4' component='h1' gutterBottom>
        Create New Course
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <CourseForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin')}
          submitLabel='Create Course'
        />
      </Paper>
    </Box>
  );
}
