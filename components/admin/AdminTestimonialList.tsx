'use client';

/**
 * AdminTestimonialList Component - Manage testimonials with approval workflow
 * Feature: 017-testimonial-management
 */

import {
  CheckCircle as ApproveIcon,
  VisibilityOff as HideIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import {
  type AdminTestimonialsApiResponse,
  getAvatarInitial,
  type TestimonialStatus,
  type TestimonialWithCourseApiResponse,
} from '@/lib/types/testimonial';

const STATUS_LABELS: Record<TestimonialStatus, string> = {
  DRAFT: 'Entwurf',
  PENDING: 'Wartet auf Freigabe',
  PUBLISHED: 'Veröffentlicht',
  HIDDEN: 'Ausgeblendet',
};

const STATUS_COLORS: Record<
  TestimonialStatus,
  'default' | 'warning' | 'success' | 'error'
> = {
  DRAFT: 'default',
  PENDING: 'warning',
  PUBLISHED: 'success',
  HIDDEN: 'error',
};

const ITEMS_PER_PAGE = 10;

export default function AdminTestimonialList() {
  const [testimonials, setTestimonials] = useState<
    TestimonialWithCourseApiResponse[]
  >([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TestimonialStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTestimonials = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors on new fetch
        const params = new URLSearchParams({
          limit: String(ITEMS_PER_PAGE),
          offset: String((page - 1) * ITEMS_PER_PAGE),
        });
        if (statusFilter) {
          params.set('status', statusFilter);
        }

        const response = await fetch(`/api/admin/testimonials?${params}`, {
          signal,
        });
        if (!response.ok) {
          throw new Error('Fehler beim Laden');
        }

        const data: AdminTestimonialsApiResponse = await response.json();
        setTestimonials(data.data.testimonials);
        setTotal(data.data.pagination.total);
      } catch (err) {
        // Ignore aborted requests
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter]
  );

  // Debounced fetch effect with abort support
  useEffect(() => {
    const controller = new AbortController();

    const debounceTimer = setTimeout(() => {
      fetchTestimonials(controller.signal);
    }, 150);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [fetchTestimonials]);

  async function updateStatus(id: string, newStatus: TestimonialStatus) {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren');
      }

      // Refresh list
      await fetchTestimonials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  if (loading && testimonials.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size='small' sx={{ minWidth: 200 }}>
          <InputLabel>Status filtern</InputLabel>
          <Select
            value={statusFilter}
            label='Status filtern'
            onChange={e => {
              setStatusFilter(e.target.value as TestimonialStatus | '');
              setPage(1);
            }}
          >
            <MenuItem value=''>Alle</MenuItem>
            <MenuItem value='PENDING'>Wartet auf Freigabe</MenuItem>
            <MenuItem value='PUBLISHED'>Veröffentlicht</MenuItem>
            <MenuItem value='HIDDEN'>Ausgeblendet</MenuItem>
            <MenuItem value='DRAFT'>Entwürfe</MenuItem>
          </Select>
        </FormControl>
        <Typography variant='body2' color='text.secondary'>
          {total} Erfahrungsbericht{total !== 1 ? 'e' : ''}
        </Typography>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* List */}
      <Stack spacing={2}>
        {testimonials.map(testimonial => (
          <Card key={testimonial.id} variant='outlined'>
            <CardContent>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={testimonial.cachedPhotoUrl || undefined}
                    alt={testimonial.cachedDisplayName}
                  >
                    {getAvatarInitial(testimonial.cachedDisplayName)}
                  </Avatar>
                  <Box>
                    <Typography variant='subtitle2' fontWeight='bold'>
                      {testimonial.cachedDisplayName}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {testimonial.course.title}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={STATUS_LABELS[testimonial.status]}
                  color={STATUS_COLORS[testimonial.status]}
                  size='small'
                />
              </Box>

              <Typography
                variant='body2'
                sx={{
                  fontStyle: 'italic',
                  color: 'text.secondary',
                  mb: 2,
                  maxHeight: 100,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                &ldquo;{testimonial.statement}&rdquo;
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant='caption' color='text.secondary'>
                  {new Date(testimonial.createdAt).toLocaleDateString('de-DE')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {(testimonial.status === 'PENDING' ||
                    testimonial.status === 'HIDDEN') && (
                    <Button
                      size='small'
                      variant='contained'
                      color='success'
                      startIcon={
                        actionLoading === testimonial.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <ApproveIcon />
                        )
                      }
                      onClick={() => updateStatus(testimonial.id, 'PUBLISHED')}
                      disabled={actionLoading === testimonial.id}
                    >
                      Freigeben
                    </Button>
                  )}
                  {testimonial.status === 'PUBLISHED' && (
                    <Button
                      size='small'
                      variant='outlined'
                      color='error'
                      startIcon={
                        actionLoading === testimonial.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <HideIcon />
                        )
                      }
                      onClick={() => updateStatus(testimonial.id, 'HIDDEN')}
                      disabled={actionLoading === testimonial.id}
                    >
                      Ausblenden
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {testimonials.length === 0 && !loading && (
        <Typography color='text.secondary' textAlign='center' sx={{ py: 4 }}>
          Keine Erfahrungsberichte gefunden.
        </Typography>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color='primary'
          />
        </Box>
      )}
    </Box>
  );
}
