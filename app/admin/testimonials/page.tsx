/**
 * Admin Testimonials Page
 * Feature: 017-testimonial-management
 *
 * Admin interface for managing testimonial approvals
 */

import { Box, Container, Typography } from '@mui/material';
import AdminTestimonialList from '@/components/admin/AdminTestimonialList';

export const metadata = {
  title: 'Erfahrungsberichte verwalten | Admin',
  description: 'Erfahrungsberichte prüfen und freigeben',
};

export default function AdminTestimonialsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Erfahrungsberichte
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Prüfe und gib Erfahrungsberichte von Kursteilnehmern frei.
        </Typography>
      </Box>

      <AdminTestimonialList />
    </Container>
  );
}
