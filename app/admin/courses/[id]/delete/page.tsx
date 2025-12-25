/**
 * Delete Course Page (Server Component)
 *
 * Confirmation page for deleting a course.
 * Note: Admin authentication is handled by the parent layout.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCourseById } from '@/lib/db/admin/courses';
import DeleteCourseForm from './DeleteCourseForm';

export const metadata: Metadata = {
  title: 'Kurs löschen | Admin',
  description: 'Kurs löschen',
};

interface DeleteCoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function DeleteCoursePage({
  params,
}: DeleteCoursePageProps) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    notFound();
  }

  const courseData = {
    id: course.id,
    title: course.title,
    thumbnailUrl: course.thumbnailUrl,
    enrollmentCount: course._count?.bookings ?? 0,
  };

  return <DeleteCourseForm course={courseData} />;
}
