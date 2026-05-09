/**
 * Vorbereitung Page
 *
 * Displays the preparation section for an upcoming booked course.
 * Navigation pattern matches the other step pages (Seminarveranstaltung, Nachbereitung, etc.).
 * Feature: 027-user-course-management
 */

import { ArrowBackOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type React from 'react';
import { requireAuthenticatedUser } from '@/lib/auth/helpers';
import { prisma } from '@/lib/db/prisma';
import { colors, typography } from '@/lib/design-tokens';
import PreparationSection from '../PreparationSection';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Vorbereitung - Hemera Academy',
  description: 'Vorbereitung für dein gebuchtes Seminar',
};

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function VorbereitungPage({
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
      paymentStatus: true,
      course: {
        select: {
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

  const hasParticipation = booking.participation !== null;

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
        Vorbereitung
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
        {booking.course.title}
      </Typography>

      <PreparationSection
        bookingId={booking.id}
        hasParticipation={hasParticipation}
        paymentStatus={booking.paymentStatus}
      />
    </Box>
  );
}
