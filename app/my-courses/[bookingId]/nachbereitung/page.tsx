/**
 * Nachbereitung Seminar Page
 *
 * Displays a video catalog with debriefing/summary videos for a completed course.
 * Feature: 027-user-course-management
 */

import { ArrowBackOutlined } from '@mui/icons-material';
import { Alert, Box, Typography } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type React from 'react';
import DebriefingVideoCatalog from '@/components/participation/DebriefingVideoCatalog';
import { requireAuthenticatedUser } from '@/lib/auth/helpers';
import { getResolvedSummaryAssets } from '@/lib/db/courseParticipation';
import { prisma } from '@/lib/db/prisma';
import { colors, typography } from '@/lib/design-tokens';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import {
  shouldLockCourseStepsUntilSeminarStart,
  shouldUnlockFutureCourseStepsInDevelopment,
} from '@/lib/utils/course-step-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Nachbereitung Seminar - Hemera Academy',
  description: 'Nachbereitungsvideos zu deinem Seminar',
};

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function NachbereitungPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { bookingId } = await params;
  const user = await requireAuthenticatedUser();

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId: user.id,
    },
    select: {
      id: true,
      course: {
        select: {
          id: true,
          startDate: true,
          title: true,
        },
      },
      participation: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  if (shouldLockCourseStepsUntilSeminarStart(booking.course.startDate)) {
    notFound();
  }

  const courseTitle = booking.course.title;
  const isDevelopmentPreview = shouldUnlockFutureCourseStepsInDevelopment(
    booking.course.startDate
  );
  let assets: Awaited<ReturnType<typeof getResolvedSummaryAssets>> = [];

  if (booking.participation) {
    try {
      assets = await getResolvedSummaryAssets(
        booking.participation.id,
        booking.course.id
      );
    } catch (error) {
      serverInstance.error('Failed to load debriefing assets', error as Error, {
        bookingId,
        participationId: booking.participation.id,
        courseId: booking.course.id,
      });
      assets = [];
    }
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      <Box
        component={Link}
        href='/dashboard'
        aria-label='Zurück zum Dashboard'
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          textDecoration: 'none',
          color: colors.marsala,
          fontFamily: typography.body,
          fontSize: '0.875rem',
          mb: 2,
          borderRadius: '4px',
          '&:focus-visible': {
            outline: `2px solid ${colors.marsala}`,
            outlineOffset: '2px',
          },
        }}
      >
        <ArrowBackOutlined sx={{ fontSize: 18 }} />
        Zurück zum Dashboard
      </Box>

      <Typography
        component='h1'
        sx={{
          fontFamily: typography.heading,
          fontSize: { xs: '1.5rem', sm: '2rem' },
          fontWeight: 600,
          color: colors.marsala,
          mb: 1,
        }}
      >
        Nachbereitung Seminar
      </Typography>

      {isDevelopmentPreview && (
        <Alert severity='info' sx={{ borderRadius: '8px', mb: 2 }}>
          Entwicklungsmodus: Dieser Schritt ist vor Seminarbeginn nur lokal zur
          Vorschau freigeschaltet.
        </Alert>
      )}

      {!booking.participation && !isDevelopmentPreview && (
        <Alert severity='info' sx={{ borderRadius: '8px', mb: 2 }}>
          Deine Teilnahme wurde noch nicht freigeschaltet. Bitte wende dich an
          den Support.
        </Alert>
      )}

      <DebriefingVideoCatalog assets={assets} courseTitle={courseTitle} />
    </Box>
  );
}
