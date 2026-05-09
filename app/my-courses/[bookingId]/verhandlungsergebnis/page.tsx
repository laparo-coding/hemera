/**
 * Verhandlungsergebnis Page
 *
 * Displays a form for recording negotiation results after a salary course.
 * Feature: 027-user-course-management
 */

import { ArrowBackOutlined } from '@mui/icons-material';
import { Alert, Box, Typography } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { NegotiationResultFormProps } from '@/components/participation/NegotiationResultForm';
import NegotiationResultForm from '@/components/participation/NegotiationResultForm';
import { saveNegotiationResultAction } from '@/lib/actions/participation';
import { requireAuthenticatedUser } from '@/lib/auth/helpers';
import { loadNegotiationResult } from '@/lib/db/courseParticipation';
import { prisma } from '@/lib/db/prisma';
import { colors, typography } from '@/lib/design-tokens';
import { isNegotiationPartner } from '@/lib/types/participation';
import { shouldUnlockFutureCourseStepsInDevelopment } from '@/lib/utils/course-step-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Verhandlungsergebnis - Hemera Academy',
  description: 'Erfasse dein Verhandlungsergebnis',
};

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function VerhandlungsergebnisPage({
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

  const existingResult = booking.participation
    ? await loadNegotiationResult(booking.participation.id)
    : null;

  const courseTitle = booking.course.title;
  const isDevelopmentPreview = shouldUnlockFutureCourseStepsInDevelopment(
    booking.course.startDate
  );

  const initialValues: NegotiationResultFormProps['initialValues'] =
    existingResult
      ? {
          resultDate: existingResult.resultDate,
          resultNegotiationPartner: isNegotiationPartner(
            existingResult.resultNegotiationPartner
          )
            ? existingResult.resultNegotiationPartner
            : null,
          resultOutcome: existingResult.resultOutcome,
        }
      : undefined;

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
        <ArrowBackOutlined aria-hidden='true' sx={{ fontSize: 18 }} />
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
        Verhandlungsergebnis
      </Typography>

      <Typography
        sx={{
          fontFamily: typography.body,
          fontSize: '1rem',
          color: colors.lightBlack,
          opacity: 0.8,
          mb: 3,
        }}
      >
        {courseTitle}
      </Typography>

      {isDevelopmentPreview && (
        <Alert severity='info' sx={{ borderRadius: '8px', mb: 3 }}>
          Entwicklungsmodus: Dieser Schritt ist vor Seminarbeginn nur lokal zur
          Vorschau freigeschaltet.
        </Alert>
      )}

      <NegotiationResultForm
        bookingId={bookingId}
        initialValues={initialValues}
        saveAction={saveNegotiationResultAction}
      />
    </Box>
  );
}
