'use client';

/**
 * TestimonialSectionMyCourses Component
 * Feature: 017-testimonial-management
 *
 * Displays testimonial form for participants who completed the course.
 * Allows creating, editing, and submitting testimonials for approval.
 */

import { RateReview as TestimonialIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import TestimonialForm from '@/components/testimonial/TestimonialForm';
import { colors } from '@/lib/design-tokens';

interface UserProfile {
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  city?: string | null;
}

interface TestimonialData {
  id: string;
  statement: string;
  nameDisplayFormat:
    | 'FULL_NAME_CITY'
    | 'FULL_NAME'
    | 'FIRST_INITIAL'
    | 'FIRST_NAME_ONLY';
  status: string;
}

interface TestimonialSectionMyCoursesProps {
  bookingId: string;
  courseName: string;
  userProfile: UserProfile;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  PENDING: 'Wartet auf Freigabe',
  PUBLISHED: 'Veröffentlicht',
  HIDDEN: 'Ausgeblendet',
};

const STATUS_COLORS: Record<
  string,
  'default' | 'warning' | 'success' | 'error'
> = {
  DRAFT: 'default',
  PENDING: 'warning',
  PUBLISHED: 'success',
  HIDDEN: 'error',
};

export default function TestimonialSectionMyCourses({
  bookingId,
  courseName,
  userProfile,
}: TestimonialSectionMyCoursesProps) {
  const [testimonial, setTestimonial] = useState<TestimonialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous error
      const response = await fetch(`/api/bookings/${bookingId}/testimonial`);

      if (response.status === 404) {
        // No testimonial exists yet
        setTestimonial(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Fehler beim Laden');
      }

      const data = await response.json();
      setTestimonial(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void fetchTestimonial();
  }, [fetchTestimonial]);

  function handleSuccess() {
    setShowForm(false);
    fetchTestimonial();
  }

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: '16px',
          border: '1px solid rgba(22, 64, 77, 0.1)',
        }}
      >
        <Skeleton variant='text' width={200} height={32} />
        <Skeleton variant='rectangular' height={100} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 3, borderRadius: '12px' }}>
        {error}
      </Alert>
    );
  }

  // Show form if user clicked "write testimonial" or is editing
  if (showForm || (!testimonial && !loading)) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: '16px',
          border: '1px solid rgba(22, 64, 77, 0.1)',
        }}
      >
        <TestimonialForm
          bookingId={bookingId}
          courseName={courseName}
          userProfile={userProfile}
          initialData={
            testimonial
              ? {
                  id: testimonial.id,
                  statement: testimonial.statement,
                  nameDisplayFormat: testimonial.nameDisplayFormat,
                  status: testimonial.status,
                }
              : undefined
          }
          onSuccess={handleSuccess}
        />
        {testimonial && (
          <Button
            variant='text'
            onClick={() => {
              setShowForm(false);
            }}
            sx={{ mt: 2 }}
          >
            Abbrechen
          </Button>
        )}
      </Paper>
    );
  }

  // Show existing testimonial
  if (testimonial) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: '16px',
          border: '1px solid rgba(22, 64, 77, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TestimonialIcon sx={{ color: 'primary.main' }} />
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Dein Erfahrungsbericht
          </Typography>
          <Chip
            size='small'
            label={STATUS_LABELS[testimonial.status] || testimonial.status}
            color={STATUS_COLORS[testimonial.status] || 'default'}
          />
        </Box>

        <Typography
          variant='body1'
          sx={{
            fontStyle: 'italic',
            mb: 3,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 1,
            borderLeft: '4px solid',
            borderLeftColor: 'primary.light',
          }}
        >
          &ldquo;{testimonial.statement}&rdquo;
        </Typography>

        {testimonial.status === 'DRAFT' && (
          <Alert severity='info' sx={{ mb: 2, borderRadius: 1 }}>
            Dein Erfahrungsbericht ist noch ein Entwurf. Klicke auf
            &quot;Bearbeiten&quot;, um ihn zur Freigabe einzureichen.
          </Alert>
        )}

        {testimonial.status === 'PENDING' && (
          <Alert severity='warning' sx={{ mb: 2, borderRadius: 1 }}>
            Dein Erfahrungsbericht wartet auf Freigabe durch unser Team.
          </Alert>
        )}

        {testimonial.status === 'PUBLISHED' && (
          <Alert severity='success' sx={{ mb: 2, borderRadius: 1 }}>
            Dein Erfahrungsbericht wurde veröffentlicht. Vielen Dank für dein
            Feedback!
          </Alert>
        )}

        <Button
          variant='outlined'
          onClick={() => {
            setShowForm(true);
          }}
          disabled={testimonial.status === 'PENDING'}
        >
          Bearbeiten
        </Button>
      </Paper>
    );
  }

  // No testimonial - show call to action
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        mb: 3,
        borderRadius: '16px',
        border: '1px solid rgba(22, 64, 77, 0.1)',
        bgcolor: colors.beige,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <TestimonialIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant='h6' sx={{ fontWeight: 600 }}>
          Teile deine Erfahrung
        </Typography>
      </Box>

      <Typography variant='body1' sx={{ mb: 3 }}>
        Du hast an diesem Kurs teilgenommen? Erzähle anderen von deinen
        Erfahrungen und hilf ihnen bei ihrer Entscheidung.
      </Typography>

      <Button
        variant='contained'
        onClick={() => {
          setShowForm(true);
        }}
        startIcon={<TestimonialIcon />}
      >
        Erfahrungsbericht schreiben
      </Button>
    </Paper>
  );
}
