'use client';

import { useUser } from '@clerk/nextjs';
import {
  CheckCircleOutlined,
  DashboardOutlined,
  SchoolOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Booking {
  id: string;
  courseTitle: string;
  price: number;
  currency: string;
  paymentStatus: string;
  createdAt: string;
}

export default function CheckoutSuccessClient() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (!sessionId) {
      // Redirect to courses page if accessed without session_id
      router.push('/courses');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(
          `/api/checkout/verify?session_id=${sessionId}`,
          {
            cache: 'no-store',
          }
        );

        const payload = await response.json().catch(() => ({ success: false }));

        if (!response.ok) {
          const message =
            typeof payload?.error === 'string'
              ? payload.error
              : 'Failed to verify payment';
          throw new Error(message);
        }

        if (payload.success) {
          setBooking(payload.booking);
          setError(null);
        } else {
          setError(payload.error || 'Payment verification failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, router]);

  if (!isLoaded || loading) {
    return (
      <Container maxWidth='md' sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant='body1' sx={{ mt: 2 }}>
          Verifying your payment...
        </Typography>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <Container maxWidth='md' sx={{ mt: 4 }}>
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant='outlined' onClick={() => router.push('/courses')}>
            Back to Courses
          </Button>
        </Box>
      </Container>
    );
  }

  if (!booking) {
    return (
      <Container maxWidth='md' sx={{ mt: 4 }}>
        <Alert severity='warning'>No booking information found.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth='md' sx={{ mt: 4 }}>
      <Card variant='outlined'>
        <CardContent>
          <Stack spacing={4} alignItems='center' textAlign='center'>
            {/* Success Icon */}
            <CheckCircleOutlined
              sx={{
                fontSize: 80,
                color: 'success.main',
              }}
            />

            {/* Success Message */}
            <Box>
              <Typography
                variant='h4'
                component='h1'
                gutterBottom
                color='success.main'
              >
                Payment Successful!
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Your course booking has been confirmed. You can now access your
                course content.
              </Typography>
            </Box>

            {/* Booking Details */}
            <Card variant='outlined' sx={{ width: '100%', maxWidth: 400 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction='row' spacing={2} alignItems='center'>
                    <SchoolOutlined color='primary' />
                    <Box>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Course
                      </Typography>
                      <Typography variant='body1'>
                        {booking.courseTitle}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction='row' justifyContent='space-between'>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Amount Paid
                    </Typography>
                    <Typography variant='body1' fontWeight='bold'>
                      {booking.currency} {(booking.price / 100).toFixed(2)}
                    </Typography>
                  </Stack>

                  <Stack direction='row' justifyContent='space-between'>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Status
                    </Typography>
                    <Typography variant='body2' color='success.main'>
                      {booking.paymentStatus}
                    </Typography>
                  </Stack>

                  <Stack direction='row' justifyContent='space-between'>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Date
                    </Typography>
                    <Typography variant='body2'>
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Stack direction='row' spacing={2}>
              <Button
                variant='outlined'
                onClick={() => router.push('/courses')}
              >
                Browse More Courses
              </Button>
              <Button
                variant='contained'
                onClick={() => router.push('/dashboard')}
                startIcon={<DashboardOutlined />}
              >
                Go to My Dashboard
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
