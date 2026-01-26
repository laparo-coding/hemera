/**
 * Course List with Delete Modal
 *
 * Client component wrapper that handles delete modal state
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteCourseAction } from '../../lib/actions/admin/courses';
import { TERMS } from '../../lib/constants';
import type { CourseWithEnrollmentCount } from '../../lib/types/admin';
import { deleteThumbnail } from '../../lib/utils/fileUpload';
import CourseList from './CourseList';
import DeleteConfirmation from './DeleteConfirmation';

interface CourseListWithDeleteProps {
  courses: CourseWithEnrollmentCount[];
}

export default function CourseListWithDelete({
  courses,
}: CourseListWithDeleteProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseWithEnrollmentCount | null>(null);
  const [_error, setError] = useState<string | null>(null);

  const handleDeleteClick = (course: CourseWithEnrollmentCount) => {
    setSelectedCourse(course);
    setDeleteModalOpen(true);
    setError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCourse) return;

    const result = await deleteCourseAction(selectedCourse.id);

    if (result.success) {
      // Cleanup thumbnail if exists
      if (selectedCourse.thumbnailUrl) {
        await deleteThumbnail(selectedCourse.thumbnailUrl);
      }

      setDeleteModalOpen(false);
      setSelectedCourse(null);
      router.refresh();
    } else {
      setError(result.error || `Fehler beim Löschen des ${TERMS.course}s`);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setSelectedCourse(null);
    setError(null);
  };

  const handleTransfer = () => {
    if (!selectedCourse) return;
    router.push(`/admin/courses/${selectedCourse.id}/transfer`);
  };

  const handlePublishToggle = async (courseId: string, publish: boolean) => {
    try {
      // Find the course to get its current updatedAt for optimistic locking
      const course = courses.find(c => c.id === courseId);
      if (!course) {
        setError(TERMS.courseNotFound);
        return;
      }

      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: publish,
          updatedAt: new Date(course.updatedAt).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            'Fehler beim Aktualisieren des Veröffentlichungsstatus'
        );
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  };

  return (
    <>
      <CourseList
        courses={courses}
        onDeleteClick={handleDeleteClick}
        onPublishToggle={handlePublishToggle}
      />

      {selectedCourse && (
        <DeleteConfirmation
          open={deleteModalOpen}
          courseTitle={selectedCourse.title}
          enrollmentCount={selectedCourse._count.bookings}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          onTransfer={handleTransfer}
        />
      )}
    </>
  );
}
