/**
 * Edit Course Page (Server Component)
 *
 * Fetches course data server-side and passes to client form.
 * Note: Admin authentication is handled by the parent layout.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCourseById } from '@/lib/db/admin/courses';
import {
  type CurriculumModule,
  curriculumSchema,
} from '@/lib/schemas/admin/course';
import { listLocations } from '@/lib/services/location';
import EditCourseForm from './EditCourseForm';

export const metadata: Metadata = {
  title: 'Kurs bearbeiten | Admin',
  description: 'Kurs bearbeiten',
};

export const dynamic = 'force-dynamic';

interface EditCoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { id } = await params;

  // Fetch course and locations in parallel
  const [course, { locations }] = await Promise.all([
    getCourseById(id),
    listLocations(),
  ]);

  if (!course) {
    notFound();
  }

  // Map locations to simple format for dropdown
  const locationOptions = locations.map(loc => ({
    id: loc.id,
    name: loc.name,
    city: loc.city,
  }));

  // Serialize dates for client component
  const courseData = {
    id: course.id,
    title: course.title,
    description: course.description,
    teaser: course.teaser,
    price: course.price,
    startDate: course.startDate?.toISOString() ?? new Date().toISOString(),
    startTime: course.startTime?.toISOString() ?? new Date().toISOString(),
    endTime: course.endTime?.toISOString() ?? new Date().toISOString(),
    instructor: course.instructor,
    level: course.level,
    thumbnailUrl: course.thumbnailUrl,
    imageDetail: course.imageDetail,
    imageTwitter: course.imageTwitter,
    capacity: course.capacity,
    updatedAt: course.updatedAt.toISOString(),
    locationId: course.locationId,
    curriculum: curriculumSchema.safeParse(course.curriculum).success
      ? (curriculumSchema.parse(course.curriculum) as CurriculumModule[] | null)
      : null,
    isPublished: course.isPublished,
    recommended: course.recommended,
    notRecommended: course.notRecommended,
    isNonPublic: course.isNonPublic,
  };

  return <EditCourseForm course={courseData} locations={locationOptions} />;
}
