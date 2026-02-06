/**
 * Admin Courses Index Page
 *
 * Main admin dashboard showing all courses
 * with actions to create, edit, and delete.
 */

import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { ADMIN_LABELS } from '@/lib/constants/admin';
import CourseListWithDelete from '../../../components/admin/CourseListWithDelete';
import { listCourses } from '../../../lib/db/admin/courses';

export const metadata: Metadata = {
  title: 'Seminarverwaltung - Admin',
  description: 'Verwalte alle Seminare im System',
};

// Force dynamic rendering since we fetch courses from DB
// This prevents static generation during build when DATABASE_URL is unavailable
export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  const courses = await listCourses();

  return (
    <AdminPageContainer
      title={ADMIN_LABELS.courses}
      subtitle='Erstelle und verwalte Seminare für deine Akademie'
      breadcrumbs={[{ label: ADMIN_LABELS.courses, href: '/admin/courses' }]}
      titleProps={{ 'data-testid': 'admin-courses-page' }}
      actions={
        <Link href='/admin/courses/new' style={{ textDecoration: 'none' }}>
          <Button variant='contained' startIcon={<AddIcon />}>
            Neues Seminar
          </Button>
        </Link>
      }
    >
      <CourseListWithDelete courses={courses} />
    </AdminPageContainer>
  );
}
