/**
 * Edit Course Page
 *
 * Form for editing an existing course
 * with optimistic locking support.
 */

'use client';

import { useUser } from '@clerk/nextjs';
import { Alert, Box, CircularProgress, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { z } from 'zod';
import CourseForm from '../../../../../components/admin/CourseForm';
import { updateCourseAction } from '../../../../../lib/actions/admin/courses';
import type { courseCreateSchema } from '../../../../../lib/schemas/admin/course';

type FormData = z.input<typeof courseCreateSchema>;

interface EditCoursePageProps {
  params: Promise<{ id: string }>;
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(
        `/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`
      );
    } else if (
      isLoaded &&
      isSignedIn &&
      user?.publicMetadata?.role !== 'admin'
    ) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, user, router]);

  const fetchCourse = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/admin/courses/${id}`);

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          router.push(
            `/sign-in?redirect=${encodeURIComponent(`/admin/courses/${id}/edit`)}`
          );
          return;
        }

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
    },
    [router]
  );

  useEffect(() => {
    params.then(resolvedParams => {
      setCourseId(resolvedParams.id);
      fetchCourse(resolvedParams.id);
    });
  }, [params, fetchCourse]);

  const handleSubmit = async (data: FormData) => {
    if (!courseId || !course) return;

    setError(null);
    const result = await updateCourseAction(courseId, {
      ...data,
      updatedAt: course.updatedAt,
    });

    if (result.success) {
      router.push('/admin/courses');
      router.refresh();
    } else {
      if (result.error?.includes('CONCURRENT_EDIT_CONFLICT')) {
        setError(
          'This course was modified by another user. Please refresh and try again.'
        );
      } else if (result.error?.includes('CAPACITY_BELOW_ENROLLMENTS')) {
        setError('Cannot reduce capacity below current enrollment count.');
      } else {
        setError(result.error || 'Failed to update course');
      }
    }
  };

  // Show loading while checking auth or fetching course
  if (!isLoaded || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Don't render anything if redirecting
  if (!isSignedIn || user?.publicMetadata?.role !== 'admin') {
    return null;
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
        Kurs bearbeiten
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <CourseForm
          initialData={{
            title: course.title,
            description: course.description,
            price: course.price,
            startDate: course.startDate
              ? new Date(course.startDate)
              : new Date(),
            startTime: course.startTime
              ? new Date(course.startTime)
              : new Date(),
            endTime: course.endTime ? new Date(course.endTime) : new Date(),
            instructor: course.instructor,
            level: course.level,
            thumbnailUrl: course.thumbnailUrl,
            capacity: course.capacity,
          }}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/courses')}
          submitLabel='Kurs aktualisieren'
        />
      </Paper>
    </Box>
  );
}
