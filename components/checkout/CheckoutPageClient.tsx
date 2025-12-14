'use client';

import { useUser } from '@clerk/nextjs';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import StripeCheckoutForm from '../payment/StripeCheckoutForm';
import { stripeAppearance, stripePromise } from '../payment/StripeProvider';

const STRIPE_ENABLED = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const STRIPE_UNAVAILABLE_MESSAGE =
  'Stripe-Zahlungen sind für diese Umgebung nicht konfiguriert. Bitte hinterlege die erforderlichen Stripe-Schlüssel, um den Checkout zu aktivieren.';

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
}

interface PaymentIntentData {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  courseName: string;
  bookingId: string;
}

function CheckoutContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Accept slug or id via multiple param names for flexibility; prefer `courseId` for backward-compatibility
  const courseRef =
    searchParams.get('courseId') ||
    searchParams.get('course') ||
    searchParams.get('courseSlug') ||
    searchParams.get('slug');

  const [course, setCourse] = useState<Course | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stripeEnabled = STRIPE_ENABLED;

  // Handle authentication redirect
  useEffect(() => {
    if (isLoaded && !user) {
      const timer = setTimeout(() => {
        const currentUrl = encodeURIComponent(window.location.href);
        router.push(`/sign-in?redirect_url=${currentUrl}`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, user, router]);

  // Fetch course details and create payment intent
  useEffect(() => {
    if (!isLoaded || !user) return;

    if (!stripeEnabled) {
      setError(STRIPE_UNAVAILABLE_MESSAGE);
      setLoading(false);
      return;
    }

    if (!courseRef) {
      setError('Kein Kurs ausgewählt');
      setLoading(false);
      return;
    }

    const fetchCourseAndCreatePaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Send as `courseId` for backward-compatibility; server resolves id or slug
          body: JSON.stringify({ courseId: courseRef }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Fehler beim Erstellen der Payment Intent'
          );
        }

        const data = await response.json();

        setCourse({
          id: courseRef as string,
          title: data.courseName,
          description: null,
          price: data.amount,
          currency: data.currency,
        });

        setPaymentIntent(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Fehler beim Laden des Zahlungsformulars'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndCreatePaymentIntent();
  }, [isLoaded, user, courseRef, stripeEnabled]);

  const handlePaymentSuccess = async (paymentIntentResult: { id: string }) => {
    try {
      const response = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntentResult.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler bei der Zahlungsbestätigung');
      }

      const confirmationData = await response.json();
      router.push(`/booking-success?bookingId=${confirmationData.bookingId}`);
    } catch (_err) {
      setError(
        'Zahlung konnte nicht verarbeitet werden. Bitte wende dich an den Support.'
      );
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isLoaded) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='50vh'
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Container maxWidth='md' sx={{ py: 4 }} data-testid='checkout-page'>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            minHeight='300px'
          >
            <Stack spacing={2} alignItems='center'>
              <CircularProgress />
              <Typography variant='body2' color='text.secondary'>
                Anmeldung wird überprüft ...
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth='md' sx={{ py: 4 }} data-testid='checkout-page'>
      {error && (
        <Alert severity='error' sx={{ mb: 3 }} data-testid='checkout-error'>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='300px'
        >
          <Stack spacing={2} alignItems='center'>
            <CircularProgress />
            <Typography variant='body2' color='text.secondary'>
              Checkout wird vorbereitet ...
            </Typography>
          </Stack>
        </Box>
      ) : course && paymentIntent ? (
        <Box
          display='flex'
          justifyContent='center'
          sx={{ mt: { xs: 4, md: 8 }, width: '100%' }}
        >
          <Box maxWidth={500} width='100%'>
            {stripePromise ? (
              <Elements
                key={paymentIntent.clientSecret}
                stripe={stripePromise}
                options={{
                  clientSecret: paymentIntent.clientSecret,
                  locale: 'de',
                  appearance: stripeAppearance,
                  loader: 'auto',
                }}
              >
                <StripeCheckoutForm
                  clientSecret={paymentIntent.clientSecret}
                  amount={paymentIntent.amount}
                  currency={paymentIntent.currency}
                  courseName={paymentIntent.courseName}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            ) : (
              <Alert severity='error'>
                Stripe ist nicht korrekt konfiguriert. Bitte wende dich an den
                Support.
              </Alert>
            )}
          </Box>
        </Box>
      ) : error ? null : (
        <Alert severity='error'>
          Kursinformationen konnten nicht geladen werden. Bitte versuche es
          erneut.
        </Alert>
      )}
    </Container>
  );
}

export default function CheckoutPageClient() {
  return (
    <Suspense
      fallback={
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='50vh'
        >
          <CircularProgress />
        </Box>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
