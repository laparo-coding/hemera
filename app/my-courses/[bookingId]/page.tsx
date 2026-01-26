/**
 * User Course Detail Page
 *
 * Displays detailed information about a specific booked course.
 * Shows preparation materials, participation data, or debriefing info
 * depending on course status.
 */

import { requireAuthenticatedUser } from '../../../lib/auth/helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { ArrowBackOutlined } from '@mui/icons-material';
import { Alert, Box, Paper, Stack, Typography } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/db/prisma';
import DebriefingSection from './DebriefingSection';
import PreparationSection from './PreparationSection';
import ResultsSection from './ResultsSection';

export const metadata: Metadata = {
  title: 'Seminardetails - Hemera Academy',
  description: 'Details zu deinem gebuchten Seminar',
};

// Design tokens
const colors = {
  cream: '#FBF5DD',
  petrol: '#16404D',
  gold: '#DDA853',
  sage: '#A6CDC6',
  white: '#FFFFFF',
} as const;

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function UserCourseDetailPage({ params }: PageProps) {
  const { bookingId } = await params;
  const user = await requireAuthenticatedUser();

  // Fetch booking with related data - use explicit select to minimize exposure
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId: user.id, // User.id is the Clerk ID
    },
    select: {
      id: true,
      paymentStatus: true,
      course: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          location: {
            select: {
              id: true,
              name: true,
              slug: true,
              address: true,
              city: true,
              zipCode: true,
            },
          },
        },
      },
      participation: {
        select: {
          id: true,
          status: true,
          preparationIntent: true,
          desiredResults: true,
          lineManagerProfile: true,
          preparationCompletedAt: true,
          debriefingPlan: true,
          salaryDiscussionMonth: true,
          resultOutcome: true,
          resultNotes: true,
          resultCompletedAt: true,
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const course = booking.course;
  const participation = booking.participation;
  const now = new Date();
  const courseEndDate = course.endDate || course.startDate;
  const isPast = courseEndDate ? courseEndDate <= now : false;
  const hasParticipation = participation !== null;

  // Determine section type
  const getSectionType = (): 'UPCOMING' | 'COMPLETED' | 'NO_SHOW' => {
    if (!isPast) return 'UPCOMING';
    if (hasParticipation) return 'COMPLETED';
    return 'NO_SHOW';
  };

  const sectionType = getSectionType();

  // Format date display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Datum noch nicht festgelegt';
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date | null) => {
    if (!time) return null;
    return time.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box
      data-testid='course-detail-page'
      sx={{
        maxWidth: 900,
        mx: 'auto',
        py: 4,
        px: { xs: 2, md: 4 },
      }}
    >
      {/* Back Navigation */}
      <Link
        href='/dashboard'
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          color: colors.petrol,
          fontFamily: '"Inter", sans-serif',
          textDecoration: 'none',
        }}
      >
        <ArrowBackOutlined sx={{ fontSize: 20 }} />
        Zurück zum Dashboard
      </Link>

      {/* Course Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: '16px',
          border: '1px solid rgba(22, 64, 77, 0.1)',
          bgcolor: colors.white,
        }}
      >
        <Typography
          component='h1'
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 700,
            color: colors.petrol,
            mb: 2,
          }}
        >
          {course.title}
        </Typography>

        <Stack spacing={2}>
          {/* Date */}
          <Box>
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: colors.petrol,
                opacity: 0.7,
                mb: 0.5,
              }}
            >
              Datum
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '1rem',
                color: colors.petrol,
              }}
            >
              {formatDate(course.startDate)}
              {course.endDate &&
                course.endDate.toDateString() !==
                  course.startDate?.toDateString() && (
                  <> bis {formatDate(course.endDate)}</>
                )}
            </Typography>
          </Box>

          {/* Time */}
          {(course.startTime || course.endTime) && (
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: colors.petrol,
                  opacity: 0.7,
                  mb: 0.5,
                }}
              >
                Uhrzeit
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '1rem',
                  color: colors.petrol,
                }}
              >
                {formatTime(course.startTime)}
                {course.endTime && <> – {formatTime(course.endTime)} Uhr</>}
              </Typography>
            </Box>
          )}

          {/* Location */}
          {course.location && (
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: colors.petrol,
                  opacity: 0.7,
                  mb: 0.5,
                }}
              >
                Veranstaltungsort
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '1rem',
                  color: colors.petrol,
                }}
              >
                <Link
                  href={`/locations/${course.location.slug}`}
                  style={{
                    color: colors.petrol,
                    textDecoration: 'underline',
                  }}
                >
                  {course.location.name}
                </Link>
                {course.location.city && <>, {course.location.city}</>}
              </Typography>
              {course.location.address && (
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.875rem',
                    color: colors.petrol,
                    opacity: 0.7,
                  }}
                >
                  {course.location.address}
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Section-specific content */}
      {sectionType === 'UPCOMING' && (
        <PreparationSection
          bookingId={booking.id}
          hasParticipation={hasParticipation}
        />
      )}

      {sectionType === 'COMPLETED' && participation && (
        <>
          <ResultsSection participation={participation} />
          <DebriefingSection courseId={course.id} bookingId={booking.id} />
        </>
      )}

      {sectionType === 'NO_SHOW' && (
        <Alert
          severity='info'
          sx={{
            borderRadius: '12px',
            '& .MuiAlert-message': {
              fontFamily: '"Inter", sans-serif',
            },
          }}
        >
          Du hast an diesem Seminar nicht teilgenommen. Bei Fragen wende dich
          bitte an unser Support-Team.
        </Alert>
      )}
    </Box>
  );
}
