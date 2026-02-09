'use client';

/**
 * Client Component for editing a course
 * Feature: 014-create-an-admin
 *
 * Receives pre-fetched course data from the Server Component parent.
 */

import { Alert, Box, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { z } from 'zod';
import CourseForm from '@/components/admin/CourseForm';
import { updateCourseAction } from '@/lib/actions/admin/courses';
import type {
  CurriculumModule,
  courseCreateSchema,
} from '@/lib/schemas/admin/course';

type FormData = z.input<typeof courseCreateSchema>;

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  teaser: string | null;
  price: number;
  startDate: string | Date;
  endDate?: string | Date | null;
  startTime: string | Date;
  endTime: string | Date;
  instructor: string;
  level: string;
  thumbnailUrl?: string | null;
  imageDetail?: string | null;
  imageTwitter?: string | null;
  capacity: number;
  updatedAt: string | Date;
  locationId?: string | null;
  curriculum?: CurriculumModule[] | null;
  isPublished?: boolean;
  recommended?: string | null;
  notRecommended?: string | null;
  isNonPublic?: boolean;
}

interface LocationOption {
  id: string;
  name: string;
  city: string;
}

interface EditCourseFormProps {
  course: CourseData;
  locations: LocationOption[];
}

export default function EditCourseForm({
  course,
  locations,
}: EditCourseFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: FormData) => {
    setError(null);
    const result = await updateCourseAction(course.id, {
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

  return (
    <Box>
      <Typography variant='h4' component='h1' gutterBottom>
        Seminar bearbeiten
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <CourseForm
          courseId={course.id}
          initialData={{
            title: course.title,
            description: course.description ?? '',
            teaser: course.teaser ?? '',
            price: course.price,
            startDate: course.startDate
              ? new Date(course.startDate)
              : new Date(),
            endDate: course.endDate ? new Date(course.endDate) : null,
            startTime: course.startTime
              ? new Date(course.startTime)
              : new Date(),
            endTime: course.endTime ? new Date(course.endTime) : new Date(),
            instructor: course.instructor,
            level: course.level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
            thumbnailUrl: course.thumbnailUrl,
            imageDetail: course.imageDetail,
            imageTwitter: course.imageTwitter,
            capacity: course.capacity,
            locationId: course.locationId,
            curriculum: course.curriculum,
            isPublished: course.isPublished,
            recommended: course.recommended,
            notRecommended: course.notRecommended,
            isNonPublic: course.isNonPublic,
          }}
          locations={locations}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/courses')}
          submitLabel='Seminar aktualisieren'
        />
      </Paper>
    </Box>
  );
}
