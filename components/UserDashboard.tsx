'use client';

import { useUser } from '@clerk/nextjs';
import { ArrowForwardOutlined, SchoolOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { TERMS } from '@/lib/constants';
import { colors } from '@/lib/design-tokens';
import { ErrorSeverity, reportError } from '@/lib/monitoring/rollbar-official';
import { isPaymentStatus, type PaymentStatus } from '@/lib/types/booking';
import { PARTICIPATION_STATUSES } from '@/lib/types/participation';
import {
  type BookingForCategorization,
  categorizeBookings as categorizeBookingsUtil,
} from '@/lib/utils/booking-categorization';
import {
  CourseCard,
  CourseProgressStepper,
  DashboardSection,
  UserPageContainer,
} from './dashboard';

const participationStatusSchema = z.preprocess(
  value => (value == null ? null : value),
  z.union([z.enum(PARTICIPATION_STATUSES), z.null()])
);

const paymentStatusSchema = z.custom<PaymentStatus>(isPaymentStatus, {
  message: 'Ungültiger paymentStatus',
});

const bookingSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  coursePrice: z.number(),
  currency: z.string(),
  paymentStatus: paymentStatusSchema,
  createdAt: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  locationName: z.string().nullable(),
  locationSlug: z.string().nullable(),
  locationCity: z.string().nullable(),
  hasParticipation: z.boolean(),
  participationStatus: participationStatusSchema,
  stripeInvoicePdfUrl: z.string().nullable(),
});

const bookingsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    bookings: z.array(bookingSchema),
    pagination: z
      .object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        pages: z.number(),
      })
      .optional(),
  }),
});

type Booking = z.infer<typeof bookingSchema>;

function logBookingsValidationError(
  flattenedError: ReturnType<z.ZodError['flatten']>
): void {
  const isRollbarDisabled =
    process.env.NEXT_PUBLIC_E2E_TEST === '1' ||
    process.env.NEXT_PUBLIC_DISABLE_ROLLBAR === '1' ||
    process.env.NEXT_PUBLIC_ROLLBAR_ENABLED === '0';

  if (!isRollbarDisabled) {
    try {
      reportError(
        new Error('Invalid bookings response'),
        {
          additionalData: {
            source: 'UserDashboard.fetchBookings',
            validationErrors: flattenedError,
          },
        },
        ErrorSeverity.WARNING
      );
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        // biome-ignore lint/suspicious/noConsole: Development fallback when monitoring is unavailable
        console.error('Invalid bookings response', flattenedError);
      }
    }

    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    // biome-ignore lint/suspicious/noConsole: Development fallback when Rollbar is disabled
    console.error('Invalid bookings response', flattenedError);
  }
}

// Categorized bookings for dashboard display (with original Booking objects)
interface CategorizedDashboardBookings {
  nextSeminar: Booking | null;
  upcoming: Booking[];
  completed: Booking[];
  noShow: Booking[];
}

/**
 * Convert API booking to format expected by categorization utility
 */
function toBookingForCategorization(
  booking: Booking
): BookingForCategorization {
  return {
    id: booking.id,
    paymentStatus: booking.paymentStatus,
    course: {
      startDate: booking.startDate ? new Date(booking.startDate) : null,
      endDate: booking.endDate ? new Date(booking.endDate) : null,
    },
    participation: booking.hasParticipation ? { id: 'exists' } : null,
  };
}

/**
 * Categorize bookings into dashboard sections using the shared utility.
 * Maps API bookings to the utility format, categorizes, then maps back.
 */
function categorizeBookings(bookings: Booking[]): CategorizedDashboardBookings {
  // Create a map for quick lookup
  const bookingMap = new Map(bookings.map(b => [b.id, b]));

  // Convert to utility format and categorize
  const forCategorization = bookings.map(toBookingForCategorization);
  const result = categorizeBookingsUtil(forCategorization);

  // Map back to original Booking objects
  return {
    nextSeminar: result.nextSeminar
      ? (bookingMap.get(result.nextSeminar.id) ?? null)
      : null,
    upcoming: result.upcoming
      .map(b => bookingMap.get(b.id))
      .filter((b): b is Booking => b !== undefined),
    completed: result.completed
      .map(b => bookingMap.get(b.id))
      .filter((b): b is Booking => b !== undefined),
    noShow: result.noShow
      .map(b => bookingMap.get(b.id))
      .filter((b): b is Booking => b !== undefined),
  };
}

// Wrapper component that decides at build time which variant to render.
// This avoids conditional hook calls within a single component.
const UserDashboard: React.FC = () => {
  const isE2EBuild =
    process.env.NEXT_PUBLIC_DISABLE_CLERK === '1' ||
    process.env.NEXT_PUBLIC_E2E_TEST === '1';

  return isE2EBuild ? <UserDashboardE2E /> : <UserDashboardClerk />;
};

type E2ESessionUser = {
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  role?: string | null;
};

function readE2ESessionUser(): E2ESessionUser | null {
  try {
    const raw = window.localStorage.getItem('clerk-session');
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed?.user ?? null;
  } catch {
    return null;
  }
}

const UserDashboardE2E: React.FC = () => {
  const [sessionUser, setSessionUser] = useState<
    E2ESessionUser | null | undefined
  >(undefined);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSessionUser(readE2ESessionUser());

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'clerk-session') {
        setSessionUser(readE2ESessionUser());
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const fetchBookings = useCallback(async () => {
    if (sessionUser === undefined) {
      return;
    }

    if (sessionUser === null) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bookings?limit=100', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'max-age=30',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch bookings`);
      }

      const data = await response.json();

      if (data.success) {
        const parsedData = bookingsResponseSchema.safeParse(data);
        if (!parsedData.success) {
          logBookingsValidationError(parsedData.error.flatten());
          throw new Error('Ungültige Buchungsdaten erhalten');
        }
        setBookings(parsedData.data.data.bookings);
      } else {
        throw new Error(data.error || 'Failed to load bookings');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionUser]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const categorized = useMemo(() => categorizeBookings(bookings), [bookings]);

  const EmptyState = useMemo(
    () => (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <SchoolOutlined sx={{ fontSize: 64, color: colors.rosyBrown, mb: 2 }} />
        <Typography
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: colors.marsala,
            mb: 1,
          }}
        >
          Beginne deine Lernreise
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '1rem',
            color: colors.lightBlack,
            opacity: 0.8,
            mb: 3,
            maxWidth: 400,
            mx: 'auto',
          }}
        >
          Entdecke unsere {TERMS.courses} und investiere in deine berufliche
          Zukunft.
        </Typography>
        <Button
          component={Link}
          href='/courses'
          variant='contained'
          color='primary'
          endIcon={<ArrowForwardOutlined />}
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: '8px',
            px: 4,
            py: 1.5,
          }}
        >
          {TERMS.discoverCourses}
        </Button>
      </Box>
    ),
    []
  );

  if (loading) {
    return (
      <UserPageContainer title='Wird geladen...' breadcrumbs={[]}>
        {[1, 2].map(item => (
          <Paper
            key={item}
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              mb: 3,
              borderRadius: '16px',
              border: '1px solid rgba(22, 64, 77, 0.1)',
              boxShadow: '0 4px 24px rgba(22, 64, 77, 0.08)',
            }}
          >
            <Skeleton
              variant='text'
              width={200}
              height={32}
              sx={{ mb: 3, bgcolor: 'rgba(166, 205, 198, 0.2)' }}
            />
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: '12px',
                border: '1px solid rgba(22, 64, 77, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Skeleton
                  variant='circular'
                  width={24}
                  height={24}
                  sx={{ bgcolor: 'rgba(166, 205, 198, 0.2)' }}
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    variant='text'
                    width='40%'
                    height={20}
                    sx={{ bgcolor: 'rgba(166, 205, 198, 0.2)' }}
                  />
                  <Skeleton
                    variant='text'
                    width='60%'
                    height={16}
                    sx={{ bgcolor: 'rgba(166, 205, 198, 0.2)' }}
                  />
                </Box>
                <Skeleton
                  variant='rounded'
                  width={120}
                  height={36}
                  sx={{
                    bgcolor: 'rgba(166, 205, 198, 0.2)',
                    borderRadius: '8px',
                  }}
                />
              </Box>
            </Paper>
          </Paper>
        ))}
      </UserPageContainer>
    );
  }

  const hasAnyBookings =
    categorized.nextSeminar !== null ||
    categorized.upcoming.length > 0 ||
    categorized.completed.length > 0 ||
    categorized.noShow.length > 0;
  const userProfile = sessionUser
    ? {
        firstName: sessionUser.firstName ?? null,
        lastName: sessionUser.lastName ?? null,
        imageUrl: sessionUser.imageUrl ?? undefined,
      }
    : undefined;

  return (
    <UserPageContainer
      title={`Willkommen zurück, ${sessionUser?.firstName || 'Benutzer'}!`}
      subtitle={`Hier findest du eine Übersicht über deine ${TERMS.courses}.`}
      breadcrumbs={[]}
    >
      <Box data-testid='user-dashboard'>
        <span style={{ display: 'none' }} data-testid='user-role'>
          {sessionUser?.role || 'user'}
        </span>

        {error && (
          <Alert
            severity='error'
            sx={{
              mb: 3,
              borderRadius: '12px',
              '& .MuiAlert-icon': {
                color: '#8B4A50',
              },
            }}
          >
            {error}
          </Alert>
        )}

        {!hasAnyBookings && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: '16px',
              border: '1px solid rgba(22, 64, 77, 0.1)',
              boxShadow: '0 4px 24px rgba(22, 64, 77, 0.08)',
              bgcolor: colors.white,
            }}
          >
            {EmptyState}
          </Paper>
        )}

        {categorized.nextSeminar && (
          <DashboardSection
            sectionType='NEXT_SEMINAR'
            testId='section-next-seminar'
          >
            <Stack spacing={2}>
              <Box>
                <CourseCard
                  id={categorized.nextSeminar.courseId}
                  bookingId={categorized.nextSeminar.id}
                  courseTitle={categorized.nextSeminar.courseTitle}
                  startDate={categorized.nextSeminar.startDate}
                  endDate={categorized.nextSeminar.endDate}
                  startTime={categorized.nextSeminar.startTime}
                  endTime={categorized.nextSeminar.endTime}
                  locationName={categorized.nextSeminar.locationName}
                  locationSlug={categorized.nextSeminar.locationSlug}
                  locationCity={categorized.nextSeminar.locationCity}
                  hasParticipation={categorized.nextSeminar.hasParticipation}
                  paymentStatus={categorized.nextSeminar.paymentStatus}
                  stripeInvoicePdfUrl={
                    categorized.nextSeminar.stripeInvoicePdfUrl
                  }
                  sectionType='NEXT_SEMINAR'
                  userProfile={userProfile}
                />
                {categorized.nextSeminar.hasParticipation && (
                  <CourseProgressStepper
                    bookingId={categorized.nextSeminar.id}
                    participationStatus={
                      categorized.nextSeminar.participationStatus
                    }
                    courseStartDate={categorized.nextSeminar.startDate}
                  />
                )}
              </Box>
            </Stack>
          </DashboardSection>
        )}

        {categorized.upcoming.length > 0 && (
          <DashboardSection sectionType='UPCOMING' testId='section-upcoming'>
            <Stack spacing={2}>
              {categorized.upcoming.map(booking => (
                <Box key={booking.id}>
                  <CourseCard
                    id={booking.courseId}
                    bookingId={booking.id}
                    courseTitle={booking.courseTitle}
                    startDate={booking.startDate}
                    endDate={booking.endDate}
                    startTime={booking.startTime}
                    endTime={booking.endTime}
                    locationName={booking.locationName}
                    locationSlug={booking.locationSlug}
                    locationCity={booking.locationCity}
                    hasParticipation={booking.hasParticipation}
                    paymentStatus={booking.paymentStatus}
                    stripeInvoicePdfUrl={booking.stripeInvoicePdfUrl}
                    sectionType='UPCOMING'
                    userProfile={userProfile}
                  />
                  {booking.hasParticipation && (
                    <CourseProgressStepper
                      bookingId={booking.id}
                      participationStatus={booking.participationStatus}
                      courseStartDate={booking.startDate}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          </DashboardSection>
        )}

        {categorized.completed.length > 0 && (
          <DashboardSection sectionType='COMPLETED' testId='section-completed'>
            <Stack spacing={2}>
              {categorized.completed.map(booking => (
                <Box key={booking.id}>
                  <CourseCard
                    id={booking.courseId}
                    bookingId={booking.id}
                    courseTitle={booking.courseTitle}
                    startDate={booking.startDate}
                    endDate={booking.endDate}
                    startTime={booking.startTime}
                    endTime={booking.endTime}
                    locationName={booking.locationName}
                    locationSlug={booking.locationSlug}
                    locationCity={booking.locationCity}
                    hasParticipation={booking.hasParticipation}
                    paymentStatus={booking.paymentStatus}
                    stripeInvoicePdfUrl={booking.stripeInvoicePdfUrl}
                    sectionType='COMPLETED'
                    userProfile={userProfile}
                  />
                  {booking.hasParticipation && (
                    <CourseProgressStepper
                      bookingId={booking.id}
                      participationStatus={booking.participationStatus}
                      courseStartDate={booking.startDate}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          </DashboardSection>
        )}

        {categorized.noShow.length > 0 && (
          <DashboardSection sectionType='NO_SHOW' testId='section-no-show'>
            <Stack spacing={2}>
              {categorized.noShow.map(booking => (
                <CourseCard
                  key={booking.id}
                  id={booking.courseId}
                  bookingId={booking.id}
                  courseTitle={booking.courseTitle}
                  startDate={booking.startDate}
                  endDate={booking.endDate}
                  startTime={booking.startTime}
                  endTime={booking.endTime}
                  locationName={booking.locationName}
                  locationSlug={booking.locationSlug}
                  locationCity={booking.locationCity}
                  hasParticipation={booking.hasParticipation}
                  paymentStatus={booking.paymentStatus}
                  stripeInvoicePdfUrl={booking.stripeInvoicePdfUrl}
                  sectionType='NO_SHOW'
                />
              ))}
            </Stack>
          </DashboardSection>
        )}
      </Box>
    </UserPageContainer>
  );
};

const UserDashboardClerk: React.FC = () => {
  const { user, isLoaded: userLoaded } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optimized fetch function with useCallback
  const fetchBookings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bookings?limit=100', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'max-age=30',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch bookings`);
      }

      const data = await response.json();

      if (data.success) {
        const parsedData = bookingsResponseSchema.safeParse(data);
        if (!parsedData.success) {
          logBookingsValidationError(parsedData.error.flatten());
          throw new Error('Ungültige Buchungsdaten erhalten');
        }
        setBookings(parsedData.data.data.bookings);
      } else {
        throw new Error(data.error || 'Failed to load bookings');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (userLoaded && user) {
      fetchBookings();
    } else if (userLoaded && !user) {
      setLoading(false);
    }
  }, [userLoaded, user, fetchBookings]);

  // Categorize bookings into sections
  const categorized = useMemo(() => categorizeBookings(bookings), [bookings]);

  // Empty state component
  const EmptyState = useMemo(
    () => (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <SchoolOutlined sx={{ fontSize: 64, color: colors.rosyBrown, mb: 2 }} />
        <Typography
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: colors.marsala,
            mb: 1,
          }}
        >
          Beginne deine Lernreise
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '1rem',
            color: colors.lightBlack,
            opacity: 0.8,
            mb: 3,
            maxWidth: 400,
            mx: 'auto',
          }}
        >
          Entdecke unsere {TERMS.courses} und investiere in deine berufliche
          Zukunft.
        </Typography>
        <Button
          component={Link}
          href='/courses'
          variant='contained'
          color='primary'
          endIcon={<ArrowForwardOutlined />}
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: '8px',
            px: 4,
            py: 1.5,
          }}
        >
          {TERMS.discoverCourses}
        </Button>
      </Box>
    ),
    []
  );

  // Loading state with skeleton
  if (!userLoaded || loading) {
    return (
      <UserPageContainer title='Wird geladen...' breadcrumbs={[]}>
        {/* Section skeletons */}
        {[1, 2].map(item => (
          <Paper
            key={item}
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              mb: 3,
              borderRadius: '16px',
              border: '1px solid rgba(22, 64, 77, 0.1)',
              boxShadow: '0 4px 24px rgba(22, 64, 77, 0.08)',
            }}
          >
            <Skeleton
              variant='text'
              width={200}
              height={32}
              sx={{ mb: 3, bgcolor: 'rgba(166, 205, 198, 0.2)' }}
            />
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: '12px',
                border: '1px solid rgba(22, 64, 77, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Skeleton
                  variant='circular'
                  width={24}
                  height={24}
                  sx={{ bgcolor: 'rgba(166, 205, 198, 0.2)' }}
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    variant='text'
                    width='40%'
                    height={20}
                    sx={{ bgcolor: 'rgba(166, 205, 198, 0.2)' }}
                  />
                  <Skeleton
                    variant='text'
                    width='60%'
                    height={16}
                    sx={{ bgcolor: 'rgba(166, 205, 198, 0.2)' }}
                  />
                </Box>
                <Skeleton
                  variant='rounded'
                  width={120}
                  height={36}
                  sx={{
                    bgcolor: 'rgba(166, 205, 198, 0.2)',
                    borderRadius: '8px',
                  }}
                />
              </Box>
            </Paper>
          </Paper>
        ))}
      </UserPageContainer>
    );
  }

  const hasAnyBookings =
    categorized.nextSeminar !== null ||
    categorized.upcoming.length > 0 ||
    categorized.completed.length > 0 ||
    categorized.noShow.length > 0;
  const userProfile = user
    ? {
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      }
    : undefined;
  return (
    <UserPageContainer
      title={`Willkommen zurück, ${user?.firstName || 'Benutzer'}!`}
      subtitle={`Hier findest du eine Übersicht über deine ${TERMS.courses}.`}
      breadcrumbs={[]}
    >
      <Box data-testid='user-dashboard'>
        <span style={{ display: 'none' }} data-testid='user-role'>
          {(user?.publicMetadata?.role as string) || 'user'}
        </span>

        {error && (
          <Alert
            severity='error'
            sx={{
              mb: 3,
              borderRadius: '12px',
              '& .MuiAlert-icon': {
                color: '#8B4A50',
              },
            }}
          >
            {error}
          </Alert>
        )}

        {/* Empty state when no bookings */}
        {!hasAnyBookings && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: '16px',
              border: '1px solid rgba(22, 64, 77, 0.1)',
              boxShadow: '0 4px 24px rgba(22, 64, 77, 0.08)',
              bgcolor: colors.white,
            }}
          >
            {EmptyState}
          </Paper>
        )}

        {/* Next Seminar Section */}
        {categorized.nextSeminar && (
          <DashboardSection
            sectionType='NEXT_SEMINAR'
            testId='section-next-seminar'
          >
            <Stack spacing={2}>
              <Box>
                <CourseCard
                  id={categorized.nextSeminar.courseId}
                  bookingId={categorized.nextSeminar.id}
                  courseTitle={categorized.nextSeminar.courseTitle}
                  startDate={categorized.nextSeminar.startDate}
                  endDate={categorized.nextSeminar.endDate}
                  startTime={categorized.nextSeminar.startTime}
                  endTime={categorized.nextSeminar.endTime}
                  locationName={categorized.nextSeminar.locationName}
                  locationSlug={categorized.nextSeminar.locationSlug}
                  locationCity={categorized.nextSeminar.locationCity}
                  hasParticipation={categorized.nextSeminar.hasParticipation}
                  paymentStatus={categorized.nextSeminar.paymentStatus}
                  stripeInvoicePdfUrl={
                    categorized.nextSeminar.stripeInvoicePdfUrl
                  }
                  sectionType='NEXT_SEMINAR'
                  userProfile={userProfile}
                />
                {categorized.nextSeminar.hasParticipation && (
                  <CourseProgressStepper
                    bookingId={categorized.nextSeminar.id}
                    participationStatus={
                      categorized.nextSeminar.participationStatus
                    }
                    courseStartDate={categorized.nextSeminar.startDate}
                  />
                )}
              </Box>
            </Stack>
          </DashboardSection>
        )}

        {/* Upcoming Seminars Section */}
        {categorized.upcoming.length > 0 && (
          <DashboardSection sectionType='UPCOMING' testId='section-upcoming'>
            <Stack spacing={2}>
              {categorized.upcoming.map(booking => (
                <Box key={booking.id}>
                  <CourseCard
                    id={booking.courseId}
                    bookingId={booking.id}
                    courseTitle={booking.courseTitle}
                    startDate={booking.startDate}
                    endDate={booking.endDate}
                    startTime={booking.startTime}
                    endTime={booking.endTime}
                    locationName={booking.locationName}
                    locationSlug={booking.locationSlug}
                    locationCity={booking.locationCity}
                    hasParticipation={booking.hasParticipation}
                    paymentStatus={booking.paymentStatus}
                    stripeInvoicePdfUrl={booking.stripeInvoicePdfUrl}
                    sectionType='UPCOMING'
                    userProfile={userProfile}
                  />
                  {booking.hasParticipation && (
                    <CourseProgressStepper
                      bookingId={booking.id}
                      participationStatus={booking.participationStatus}
                      courseStartDate={booking.startDate}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          </DashboardSection>
        )}

        {/* Completed Seminars Section */}
        {categorized.completed.length > 0 && (
          <DashboardSection sectionType='COMPLETED' testId='section-completed'>
            <Stack spacing={2}>
              {categorized.completed.map(booking => (
                <Box key={booking.id}>
                  <CourseCard
                    id={booking.courseId}
                    bookingId={booking.id}
                    courseTitle={booking.courseTitle}
                    startDate={booking.startDate}
                    endDate={booking.endDate}
                    startTime={booking.startTime}
                    endTime={booking.endTime}
                    locationName={booking.locationName}
                    locationSlug={booking.locationSlug}
                    locationCity={booking.locationCity}
                    hasParticipation={booking.hasParticipation}
                    paymentStatus={booking.paymentStatus}
                    stripeInvoicePdfUrl={booking.stripeInvoicePdfUrl}
                    sectionType='COMPLETED'
                    userProfile={userProfile}
                  />
                  {booking.hasParticipation && (
                    <CourseProgressStepper
                      bookingId={booking.id}
                      participationStatus={booking.participationStatus}
                      courseStartDate={booking.startDate}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          </DashboardSection>
        )}

        {/* No-Show Seminars Section */}
        {categorized.noShow.length > 0 && (
          <DashboardSection sectionType='NO_SHOW' testId='section-no-show'>
            <Stack spacing={2}>
              {categorized.noShow.map(booking => (
                <CourseCard
                  key={booking.id}
                  id={booking.courseId}
                  bookingId={booking.id}
                  courseTitle={booking.courseTitle}
                  startDate={booking.startDate}
                  endDate={booking.endDate}
                  startTime={booking.startTime}
                  endTime={booking.endTime}
                  locationName={booking.locationName}
                  locationSlug={booking.locationSlug}
                  locationCity={booking.locationCity}
                  hasParticipation={booking.hasParticipation}
                  paymentStatus={booking.paymentStatus}
                  stripeInvoicePdfUrl={booking.stripeInvoicePdfUrl}
                  sectionType='NO_SHOW'
                />
              ))}
            </Stack>
          </DashboardSection>
        )}
      </Box>
    </UserPageContainer>
  );
};

export default UserDashboard;
