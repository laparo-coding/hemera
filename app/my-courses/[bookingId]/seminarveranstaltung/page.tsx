/**
 * Seminarveranstaltung Page
 *
 * Displays the course curriculum for a booked course.
 * Navigation pattern matches the Nachbereitung page.
 * Feature: 027-user-course-management
 */

import { ArrowBackOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type React from 'react';
import type { CurriculumModule } from '@/components/course-detail/CurriculumSection';
import { CurriculumSection } from '@/components/course-detail/CurriculumSection';
import { requireAuthenticatedUser } from '@/lib/auth/helpers';
import { prisma } from '@/lib/db/prisma';
import { colors, typography } from '@/lib/design-tokens';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Seminarveranstaltung - Hemera Academy',
  description: 'Seminarablauf und Curriculum',
};

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

function parseCurriculumModules(raw: unknown): CurriculumModule[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter((mod): mod is CurriculumModule => {
    if (typeof mod !== 'object' || mod === null) return false;
    const rec = mod as Record<string, unknown>;
    return (
      typeof rec.id === 'string' &&
      typeof rec.day === 'number' &&
      typeof rec.title === 'string' &&
      Array.isArray(rec.topics) &&
      rec.topics.every(
        (t: unknown) =>
          typeof t === 'object' &&
          t !== null &&
          typeof (t as Record<string, unknown>).id === 'string' &&
          typeof (t as Record<string, unknown>).title === 'string'
      )
    );
  });
}

export default async function SeminarveranstaltungPage({
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
      course: {
        select: {
          title: true,
          curriculum: true,
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const courseTitle = booking.course.title;
  const modules = parseCurriculumModules(booking.course.curriculum);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      <Link
        href={bookingId ? `/my-courses/${bookingId}` : '/dashboard'}
        style={{ textDecoration: 'none' }}
        aria-label='Zurück zur Buchungsübersicht'
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            color: colors.marsala,
            fontFamily: typography.body,
            fontSize: '0.875rem',
            mb: 2,
          }}
        >
          <ArrowBackOutlined sx={{ fontSize: 18 }} />
          Zurück zum Dashboard
        </Box>
      </Link>

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
        Seminarveranstaltung
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

      {modules.length > 0 ? (
        <CurriculumSection modules={modules} />
      ) : (
        <Typography
          sx={{
            fontFamily: typography.body,
            fontSize: '0.875rem',
            color: colors.lightBlack,
            opacity: 0.7,
            textAlign: 'center',
            py: 4,
          }}
        >
          Das Curriculum für dein Seminar steht leider noch nicht zur Verfügung.
        </Typography>
      )}
    </Box>
  );
}
