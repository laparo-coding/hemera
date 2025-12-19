/**
 * Delete Course Page
 *
 * Confirmation page for deleting a course
 * with enrollment check and transfer option.
 */

'use client';

import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DeleteConfirmation from '../../../../../components/admin/DeleteConfirmation';
import { deleteCourseAction } from '../../../../../lib/actions/admin/courses';
import { deleteThumbnail } from '../../../../../lib/utils/fileUpload';

interface DeleteCoursePageProps {
  params: Promise<{ id: string }>;
}

export default function DeleteCoursePage({ params }: DeleteCoursePageProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(resolvedParams => {
      setCourseId(resolvedParams.id);
      fetchCourse(resolvedParams.id);
    });
  }, [params, fetchCourse]);

  const fetchCourse = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/courses/${id}`);
      if (!response.ok) {
        throw new Error('Course not found');
      }
      const data = await response.json();
      setCourse(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!courseId) return;

    const result = await deleteCourseAction(courseId);

    if (result.success) {
      // Cleanup thumbnail if exists
      if (course?.thumbnailUrl) {
        await deleteThumbnail(course.thumbnailUrl);
      }

      router.push('/admin');
      router.refresh();
    } else {
      setError(result.error || 'Failed to delete course');
    }
  };

  const handleTransfer = () => {
    if (!courseId) return;
    // Navigate to transfer page (to be implemented)
    router.push(`/admin/courses/${courseId}/transfer`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !course) {
    return (
      <Alert severity='error' sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant='h4' component='h1' gutterBottom>
        Kurs löschen
      </Typography>

      <DeleteConfirmation
        open={true}
        courseTitle={course?.title || ''}
        enrollmentCount={course?._count?.bookings || 0}
        onConfirm={handleDelete}
        onCancel={() => router.push('/admin')}
        onTransfer={handleTransfer}
      />
    </Box>
  );
}
