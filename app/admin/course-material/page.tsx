/**
 * Course Material Overview Page
 * Feature: 023-slide-editor
 *
 * Admin page listing all course materials with search and CRUD actions.
 */

import type { Metadata } from 'next';
import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import CourseMaterialTable from '@/components/admin/CourseMaterialTable';

export const metadata: Metadata = {
  title: 'Seminarmaterial | Admin | Hemera Academy',
  description: 'Verwalte Seminarmaterialien für deine Kurse',
};

export default function CourseMaterialPage() {
  return (
    <AdminPageContainer
      title='Seminarmaterial'
      subtitle='Erstelle und verwalte Seminarmaterialien, die du in deinen Kursen verwenden kannst.'
      breadcrumbs={[
        { label: 'Seminarmaterial', href: '/admin/course-material' },
      ]}
      titleProps={{ 'data-testid': 'admin-course-material-page' }}
    >
      <CourseMaterialTable />
    </AdminPageContainer>
  );
}
