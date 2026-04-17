/**
 * CourseCard Component
 *
 * Enhanced course card displaying date, time, location and action buttons.
 * Used in dashboard sections for displaying booked courses.
 */

'use client';

import {
  ArrowForwardOutlined,
  CalendarTodayOutlined,
  LocationOnOutlined,
  ScheduleOutlined,
  SchoolOutlined,
} from '@mui/icons-material';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { colors } from '@/lib/design-tokens';
import type { PaymentStatus } from '@/lib/types/booking';
import InvoiceDownloadButton from './InvoiceDownloadButton';
import TestimonialButton from './TestimonialButton';

export interface CourseCardProps {
  id: string;
  bookingId: string;
  courseTitle: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  locationSlug: string | null;
  locationCity: string | null;
  hasParticipation: boolean;
  paymentStatus: PaymentStatus;
  stripeInvoicePdfUrl: string | null;
  /** Which section this card is displayed in */
  sectionType: 'NEXT_SEMINAR' | 'UPCOMING' | 'COMPLETED' | 'NO_SHOW';
  /** User profile for testimonial drawer */
  userProfile?: {
    firstName: string | null;
    lastName: string | null;
    imageUrl?: string;
    city?: string;
  };
}

/**
 * Format date range for display
 */
export const formatDateRange = (
  startDate: string | null,
  endDate: string | null
): string => {
  if (!startDate) return 'Datum noch nicht festgelegt';

  const start = new Date(startDate);
  const startFormatted = start.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (!endDate) return startFormatted;

  const end = new Date(endDate);
  const isSameDay = start.toDateString() === end.toDateString();

  if (isSameDay) return startFormatted;

  const endFormatted = end.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `${startFormatted} - ${endFormatted}`;
};

/**
 * Format time range for display
 */
export const formatTimeRange = (
  startTime: string | null,
  endTime: string | null
): string => {
  if (!startTime || !endTime) return '';

  const start = new Date(startTime);
  const end = new Date(endTime);

  const startFormatted = start.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endFormatted = end.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${startFormatted} - ${endFormatted} Uhr`;
};

/**
 * Get location display text
 */
export const getLocationDisplayText = (
  name: string | null,
  city: string | null
): string => {
  if (!name) return '';
  if (!city) return name;
  return `${name}, ${city}`;
};

/**
 * Check if invoice download should be visible
 */
const shouldShowInvoiceButton = (
  _sectionType: CourseCardProps['sectionType'],
  paymentStatus: PaymentStatus,
  _invoiceUrl: string | null
): boolean => {
  // Show invoice for all paid bookings, regardless of course status
  // Users should be able to download their invoice immediately after payment
  if (!['PAID', 'CONFIRMED'].includes(paymentStatus)) return false;
  // Only if we have or can get an invoice
  return true;
};

export default function CourseCard({
  id: _id,
  bookingId,
  courseTitle,
  startDate,
  endDate,
  startTime,
  endTime,
  locationName,
  locationSlug,
  locationCity,
  hasParticipation: _hasParticipation,
  paymentStatus,
  stripeInvoicePdfUrl,
  sectionType,
  userProfile,
}: CourseCardProps) {
  const showTestimonialButton =
    sectionType === 'COMPLETED' && userProfile != null;
  const dateText = formatDateRange(startDate, endDate);
  const timeText = formatTimeRange(startTime, endTime);
  const locationText = getLocationDisplayText(locationName, locationCity);
  const showInvoice = shouldShowInvoiceButton(
    sectionType,
    paymentStatus,
    stripeInvoicePdfUrl
  );

  // Determine primary action based on section
  const getPrimaryAction = () => {
    switch (sectionType) {
      case 'NEXT_SEMINAR':
      case 'UPCOMING':
        return (
          <Button
            component={Link}
            href={`/my-courses/${bookingId}`}
            variant='contained'
            color='primary'
            endIcon={<ArrowForwardOutlined />}
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              py: 1,
            }}
          >
            Vorbereitung
          </Button>
        );
      case 'COMPLETED':
        return (
          <Button
            component={Link}
            href={`/my-courses/${bookingId}`}
            variant='contained'
            color='primary'
            endIcon={<ArrowForwardOutlined />}
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              py: 1,
            }}
          >
            Details
          </Button>
        );
      case 'NO_SHOW':
        return (
          <Chip
            label='Nicht teilgenommen'
            size='small'
            sx={{
              bgcolor: colors.tealAlpha10,
              color: colors.marsala,
              fontFamily: '"Inter", sans-serif',
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Paper
      elevation={0}
      data-testid={`course-card-${bookingId}`}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: '12px',
        border: `1px solid ${colors.tealAlpha10}`,
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: `0 4px 12px ${colors.tealAlpha12}`,
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent='space-between'
      >
        {/* Course Info */}
        <Box sx={{ flex: 1 }}>
          <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 1 }}>
            <SchoolOutlined sx={{ color: colors.marsala }} />
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '1rem',
                fontWeight: 600,
                color: colors.marsala,
              }}
            >
              {courseTitle}
            </Typography>
          </Stack>

          {/* Date/Time/Location Row */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 3 }}
            sx={{ ml: 5 }}
          >
            {/* Date */}
            <Stack direction='row' spacing={0.5} alignItems='center'>
              <CalendarTodayOutlined
                sx={{ fontSize: 16, color: colors.marsala, opacity: 0.7 }}
              />
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.875rem',
                  color: colors.lightBlack,
                  opacity: 0.7,
                }}
              >
                {dateText}
              </Typography>
            </Stack>

            {/* Time */}
            {timeText && (
              <Stack direction='row' spacing={0.5} alignItems='center'>
                <ScheduleOutlined
                  sx={{ fontSize: 16, color: colors.marsala, opacity: 0.7 }}
                />
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.875rem',
                    color: colors.lightBlack,
                    opacity: 0.7,
                  }}
                >
                  {timeText}
                </Typography>
              </Stack>
            )}

            {/* Location */}
            {locationText && (
              <Stack direction='row' spacing={0.5} alignItems='center'>
                <LocationOnOutlined
                  sx={{ fontSize: 16, color: colors.marsala, opacity: 0.7 }}
                />
                {locationSlug ? (
                  <Link
                    href={`/locations/${locationSlug}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '0.875rem',
                        color: colors.lightBlack,
                        opacity: 0.7,
                        '&:hover': {
                          opacity: 1,
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {locationText}
                    </Typography>
                  </Link>
                ) : (
                  <Typography
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '0.875rem',
                      color: colors.lightBlack,
                      opacity: 0.7,
                    }}
                  >
                    {locationText}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>

          {/* Invoice Download - shown below date/time/location */}
          {showInvoice && (
            <Box sx={{ ml: 5, mt: 1 }}>
              <InvoiceDownloadButton bookingId={bookingId} />
            </Box>
          )}
        </Box>

        {/* Actions */}
        <Stack sx={{ flexShrink: 0, alignItems: 'flex-end' }} spacing={1}>
          {getPrimaryAction()}
          {showTestimonialButton && userProfile && (
            <TestimonialButton
              bookingId={bookingId}
              courseName={courseTitle}
              userProfile={userProfile}
            />
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
