/**
 * Admin Testimonials Page
 * Feature: 017-testimonial-management
 *
 * Admin interface for managing testimonial approvals
 */

import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import AdminTestimonialList from '@/components/admin/AdminTestimonialList';
import { ADMIN_LABELS } from '@/lib/constants/admin';

export const metadata = {
  title: 'Erfahrungsberichte verwalten | Admin',
  description: 'Erfahrungsberichte prüfen und freigeben',
};

export default function AdminTestimonialsPage() {
  return (
    <AdminPageContainer
      title={ADMIN_LABELS.testimonials}
      subtitle='Prüfe und gib Erfahrungsberichte von Kursteilnehmern frei.'
      breadcrumbs={[
        { label: ADMIN_LABELS.testimonials, href: '/admin/testimonials' },
      ]}
      titleProps={{ 'data-testid': 'admin-testimonials-page' }}
    >
      <AdminTestimonialList />
    </AdminPageContainer>
  );
}
