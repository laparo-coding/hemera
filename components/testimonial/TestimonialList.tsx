'use client';

/**
 * TestimonialList Component - Display testimonials on course detail page
 * Feature: 017-testimonial-management
 */

import {
  Box,
  Grid,
  Typography,
  Skeleton,
  Alert,
} from '@mui/material';
import { useEffect, useState } from 'react';
import TestimonialCard from './TestimonialCard';
import type { PublicTestimonial } from '@/lib/schemas/testimonial-schema';

interface TestimonialListProps {
  courseSlug: string;
  limit?: number;
}

export default function TestimonialList({
  courseSlug,
  limit = 6,
}: TestimonialListProps) {
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/courses/${courseSlug}/testimonials?limit=${limit}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            // Course not found - just show no testimonials
            setTestimonials([]);
            return;
          }
          throw new Error('Fehler beim Laden');
        }

        const data = await response.json();
        setTestimonials(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonials();
  }, [courseSlug, limit]);

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
          Was Teilnehmer sagen
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 4 }}>
              <Skeleton
                variant="rectangular"
                height={200}
                sx={{ borderRadius: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  // Don't render section if no testimonials
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
        Was Teilnehmer sagen
      </Typography>
      <Grid container spacing={3}>
        {testimonials.map((testimonial) => (
          <Grid key={testimonial.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <TestimonialCard testimonial={testimonial} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
