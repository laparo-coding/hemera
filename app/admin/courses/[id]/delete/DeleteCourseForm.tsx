'use client';

/**
 * Client Component for deleting a course
 * Feature: 014-create-an-admin
 *
 * Receives pre-fetched course data from the Server Component parent.
 */

import { Alert, Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DeleteConfirmation from '@/components/admin/DeleteConfirmation';
import { deleteCourseAction } from '@/lib/actions/admin/courses';
import { deleteThumbnail } from '@/lib/utils/fileUpload';

interface CourseData {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  enrollmentCount: number;
}

interface DeleteCourseFormProps {
  course: CourseData;
}

export default function DeleteCourseForm({ course }: DeleteCourseFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    const result = await deleteCourseAction(course.id);

    if (result.success) {
      // Cleanup thumbnail if exists
      if (course.thumbnailUrl) {
        await deleteThumbnail(course.thumbnailUrl);
      }

      router.push('/admin');
      router.refresh();
    } else {
      setError(result.error || 'Failed to delete course');
    }
  };

  const handleTransfer = () => {
    // Navigate to transfer page (to be implemented)
    router.push(`/admin/courses/${course.id}/transfer`);
  };

  return (
    <Box>
      <Typography variant='h4' component='h1' gutterBottom>
        Kurs löschen
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <DeleteConfirmation
        open={true}
        courseTitle={course.title}
        enrollmentCount={course.enrollmentCount}
        onConfirm={handleDelete}
        onCancel={() => router.push('/admin')}
        onTransfer={handleTransfer}
      />
    </Box>
  );
}
