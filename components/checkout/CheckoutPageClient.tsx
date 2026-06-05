'use client';

import { useUser } from '@clerk/nextjs';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { TERMS } from '../../lib/constants/terminology';
import { logClientError } from '../../lib/errors/client';
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

interface BookingReviewResponse {
  requiresReview: true;
  bookingId: string;
  message?: string;
  missingPrerequisite?: 'BEGINNER' | 'INTERMEDIATE';
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
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [authLoadTimedOut, setAuthLoadTimedOut] = useState(false);
  const stripeEnabled = STRIPE_ENABLED;

  useEffect(() => {
    if (isLoaded) {
      setAuthLoadTimedOut(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAuthLoadTimedOut(true);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [isLoaded]);

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
      setError(TERMS.noCourseSelected);
      setLoading(false);
      return;
    }

    const fetchCourseAndCreatePaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Send as `courseId` for backward-compatibility; server resolves id or slug
          body: JSON.stringify({ courseId: courseRef }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const receivedErrorCode =
            typeof errorData.errorCode === 'string'
              ? errorData.errorCode
              : null;

          // Expected business states should not be treated as technical errors.
          if (
            receivedErrorCode === 'BOOKING_UNDER_REVIEW' ||
            receivedErrorCode === 'DUPLICATE_BOOKING'
          ) {
            setErrorCode(receivedErrorCode);
            setError(
              typeof errorData.error === 'string' && errorData.error.length > 0
                ? errorData.error
                : receivedErrorCode === 'BOOKING_UNDER_REVIEW'
                  ? 'Deine Buchung wird gerade geprüft. Bitte warte auf die Freigabe durch einen Administrator.'
                  : 'Du hast diesen Kurs bereits gebucht.'
            );
            setCourse(null);
            setPaymentIntent(null);
            return;
          }

          if (receivedErrorCode) {
            setErrorCode(receivedErrorCode);
          }
          throw new Error(
            errorData.error || `Fehler beim Laden: ${response.status}`
          );
        }

        const data = await response.json();

        if ((data as BookingReviewResponse).requiresReview) {
          setErrorCode('BOOKING_UNDER_REVIEW');
          setError(
            (data as BookingReviewResponse).message ||
              'Deine Buchung wurde zur Prüfung eingereicht. Du bekommst eine Rückmeldung nach der Freigabe.'
          );
          setCourse(null);
          setPaymentIntent(null);
          return;
        }

        const paymentData = data as Partial<PaymentIntentData>;
        if (
          !paymentData.clientSecret ||
          !paymentData.paymentIntentId ||
          typeof paymentData.amount !== 'number' ||
          !Number.isFinite(paymentData.amount) ||
          !paymentData.currency ||
          !paymentData.courseName ||
          !paymentData.bookingId
        ) {
          throw new Error(
            'Checkout konnte nicht initialisiert werden. Bitte versuche es erneut.'
          );
        }

        setCourse({
          id: courseRef as string,
          title: paymentData.courseName,
          description: null,
          price: paymentData.amount,
          currency: paymentData.currency,
        });

        setPaymentIntent(paymentData as PaymentIntentData);
      } catch (err) {
        logClientError(err, { context: 'Payment intent creation' });
        let errorMessage = 'Fehler beim Laden des Zahlungsformulars';

        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            errorMessage =
              'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.';
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndCreatePaymentIntent();
    // Note: stripeEnabled is a constant from env, not included in deps
  }, [isLoaded, user, courseRef]);

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
    if (authLoadTimedOut) {
      return (
        <Container maxWidth='md' sx={{ py: 4 }} data-testid='checkout-page'>
          <Alert
            severity='warning'
            action={
              <Button
                component={Link}
                href='/sign-in'
                color='inherit'
                size='small'
              >
                Anmelden
              </Button>
            }
          >
            Anmeldung konnte nicht geladen werden. Bitte lade die Seite neu oder
            melde dich erneut an.
          </Alert>
        </Container>
      );
    }

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

  // User not loaded yet - redirect effect will handle this
  if (!user) {
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

  return (
    <Container maxWidth='md' sx={{ py: 4 }} data-testid='checkout-page'>
      {error && (
        <Alert
          severity='error'
          sx={{ mb: 3 }}
          data-testid='checkout-error'
          action={
            errorCode === 'DUPLICATE_BOOKING' ||
            errorCode === 'BOOKING_UNDER_REVIEW' ||
            error.includes('bereits gebucht') ||
            error.includes('geprüft') ? (
              <Button
                component={Link}
                href='/dashboard'
                color='inherit'
                size='small'
                sx={{ whiteSpace: 'nowrap' }}
              >
                Meine Seminare
              </Button>
            ) : undefined
          }
        >
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
