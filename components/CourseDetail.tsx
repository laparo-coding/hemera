'use client';

import BookOnlineOutlinedIcon from '@mui/icons-material/BookOnlineOutlined';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import {
  Box,
  Button,
  CardMedia,
  Chip,
  Container,
  Grid,
  Paper,
  Skeleton,
  Stack,
  SvgIcon,
  type SvgIconProps,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { formatDate } from '../lib/utils/date-format';

interface CourseLocation {
  id: string;
  name: string;
  slug: string;
  city: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number;
  currency: string;
  capacity?: number | null;
  startDate?: Date | null;
  startTime?: Date | null;
  endTime?: Date | null;
  isPublished: boolean;
  thumbnailUrl?: string | null;
  imageDetail?: string | null;
  imageTwitter?: string | null;
  instructor?: string | null;
  createdAt: Date;
  updatedAt: Date;
  availableSpots?: number | null;
  totalBookings?: number;
  userBookingStatus?: string | null;
  location?: CourseLocation | null;
}

interface CourseDetailProps {
  course: Course;
  onBookNow?: (courseId: string) => void;
  isLoading?: boolean;
  bookNowHref?: string;
}

const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute' as const,
  width: 1,
};

const CoinIcon: React.FC<SvgIconProps> = props => (
  <SvgIcon viewBox='0 0 24 24' {...props}>
    <circle
      cx='12'
      cy='12'
      r='9'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
    />
    <circle
      cx='12'
      cy='12'
      r='4.5'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      opacity='0.6'
    />
  </SvgIcon>
);

const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  onBookNow,
  isLoading = false,
  bookNowHref,
}) => {
  const [isBooking, setIsBooking] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Avoid hydration mismatch by only calculating time-dependent values after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isCourseInPast = useMemo(() => {
    if (!isMounted) return false; // Return stable value during SSR
    if (!course.startDate) return false;
    const dateValue =
      course.startDate instanceof Date
        ? course.startDate
        : new Date(course.startDate);
    return Number.isFinite(dateValue.getTime()) && dateValue < new Date();
  }, [course.startDate, isMounted]);

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null || amount === undefined) {
      return 'Kostenlos';
    }

    // Prices are stored in cents, convert to euros for display
    const amountInEuros = amount / 100;
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: Number.isInteger(amountInEuros) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amountInEuros);
  };

  const handleBookNow = async (
    event?: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    if (onBookNow) {
      event?.preventDefault();
      if (isBooking) return;
      setIsBooking(true);
      try {
        await onBookNow(course.id);
      } finally {
        setIsBooking(false);
      }
    }
  };

  const bookingButtonText = useMemo(() => {
    if (isBooking) return 'Buchung läuft...';
    if (course.userBookingStatus === 'PAID') return 'Bereits gebucht';
    if (course.userBookingStatus === 'PENDING') return 'Zahlung ausstehend';
    if (course.availableSpots === 0) return 'Ausgebucht';
    return 'Jetzt buchen';
  }, [course.availableSpots, course.userBookingStatus, isBooking]);

  const isBookingDisabled = useMemo(() => {
    return (
      isBooking ||
      course.userBookingStatus === 'PAID' ||
      (course.availableSpots !== null && course.availableSpots === 0) ||
      !course.isPublished ||
      isCourseInPast
    );
  }, [
    course.availableSpots,
    course.isPublished,
    course.userBookingStatus,
    isBooking,
    isCourseInPast,
  ]);

  const disableReason = useMemo(() => {
    if (!isBookingDisabled) return null;
    if (course.userBookingStatus === 'PAID')
      return 'Du hast diesen Kurs bereits gebucht.';
    if (course.availableSpots !== null && course.availableSpots === 0)
      return 'Dieser Kurs ist aktuell ausgebucht.';
    if (!course.isPublished)
      return 'Dieser Kurs ist noch nicht veröffentlicht.';
    if (isCourseInPast) return 'Der Kurstermin liegt in der Vergangenheit.';
    if (isBooking) return 'Buchung läuft...';
    return 'Buchung derzeit nicht möglich.';
  }, [
    course.availableSpots,
    course.isPublished,
    course.userBookingStatus,
    isBooking,
    isBookingDisabled,
    isCourseInPast,
  ]);

  const formattedDate = useMemo(() => {
    if (!course.startDate) return null;
    return formatDate(course.startDate) ?? null;
  }, [course.startDate]);

  const formattedTime = useMemo(() => {
    if (!course.startTime || !course.endTime) return null;
    const startTime =
      course.startTime instanceof Date
        ? course.startTime
        : new Date(course.startTime);
    const endTime =
      course.endTime instanceof Date
        ? course.endTime
        : new Date(course.endTime);
    if (
      !Number.isFinite(startTime.getTime()) ||
      !Number.isFinite(endTime.getTime())
    )
      return null;
    const formatOpts: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Berlin',
    };
    return `${startTime.toLocaleTimeString('de-DE', formatOpts)} - ${endTime.toLocaleTimeString('de-DE', formatOpts)}`;
  }, [course.startTime, course.endTime]);

  if (isLoading) {
    return (
      <Paper aria-busy='true' aria-live='polite' sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Skeleton
            variant='rectangular'
            height={320}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton variant='text' height={48} width='60%' />
          <Skeleton variant='text' height={24} width='40%' />
          <Skeleton
            variant='rectangular'
            height={120}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant='rectangular'
            height={56}
            width={180}
            sx={{ borderRadius: 999 }}
          />
        </Stack>
      </Paper>
    );
  }

  return (
    <Container
      maxWidth='lg'
      sx={{
        pt: { xs: 10, md: 12 },
        pb: 4,
      }}
    >
      <Grid container spacing={4} alignItems='flex-start'>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {course.imageDetail || course.thumbnailUrl ? (
              <CardMedia sx={{ position: 'relative', aspectRatio: '4.5 / 1' }}>
                <Image
                  src={course.imageDetail || course.thumbnailUrl || ''}
                  alt={course.title}
                  fill
                  sizes='(min-width: 1200px) 720px, 100vw'
                  style={{ objectFit: 'cover' }}
                />
              </CardMedia>
            ) : (
              <Box
                sx={{
                  height: 70,
                  bgcolor: '#16404D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant='h2'
                  sx={{
                    color: '#FFFFFF',
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 700,
                    fontSize: { xs: '3rem', md: '4rem' },
                  }}
                >
                  {course.title.charAt(0)}
                </Typography>
              </Box>
            )}
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                <div>
                  <Typography
                    variant='h3'
                    component='h1'
                    sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}
                  >
                    {course.title}
                  </Typography>
                  {course.instructor && (
                    <Stack
                      direction='row'
                      spacing={0.5}
                      alignItems='center'
                      sx={{ mt: 1 }}
                    >
                      <PersonRoundedIcon
                        sx={{ fontSize: 20, color: 'text.primary' }}
                      />
                      <Typography
                        variant='body1'
                        sx={{ color: 'text.secondary' }}
                      >
                        Dozent: {course.instructor}
                      </Typography>
                    </Stack>
                  )}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                      mt: 2,
                      color: 'text.secondary',
                    }}
                  >
                    {formattedDate && (
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <CalendarMonthRoundedIcon
                          sx={{ fontSize: '1.25rem' }}
                        />
                        <Typography sx={{ fontSize: '0.9rem' }}>
                          {formattedDate}
                          {formattedTime && ` · ${formattedTime}`}
                        </Typography>
                      </Stack>
                    )}
                    {course.capacity ? (
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <GroupRoundedIcon sx={{ fontSize: '1.25rem' }} />
                        <Typography sx={{ fontSize: '0.9rem' }}>
                          {course.availableSpots !== null
                            ? `${course.availableSpots} von ${course.capacity} Plätzen verfügbar`
                            : `${course.capacity} Plätze`}
                        </Typography>
                      </Stack>
                    ) : null}
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <CoinIcon sx={{ fontSize: '1.25rem' }} />
                      <Typography sx={{ fontSize: '0.9rem' }}>
                        {formatCurrency(course.price, course.currency)}
                      </Typography>
                    </Stack>
                    {course.location && (
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <LocationOnRoundedIcon sx={{ fontSize: '1.25rem' }} />
                        <Link
                          href={`/locations/${course.location.slug}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {course.location.name}, {course.location.city}
                          </Typography>
                        </Link>
                      </Stack>
                    )}
                  </Box>
                </div>

                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  {!course.isPublished ? (
                    <Chip
                      label='Nicht veröffentlicht'
                      color='warning'
                      size='small'
                    />
                  ) : null}
                  {course.userBookingStatus === 'PAID' ? (
                    <Chip label='✓ Gebucht' color='success' size='small' />
                  ) : null}
                  {course.userBookingStatus === 'PENDING' ? (
                    <Chip
                      label='⏳ Zahlung ausstehend'
                      color='warning'
                      size='small'
                      variant='outlined'
                    />
                  ) : null}
                  {course.availableSpots === 0 ? (
                    <Chip
                      label='Ausgebucht'
                      color='error'
                      size='small'
                      data-testid='course-detail-sold-out-badge'
                    />
                  ) : null}
                  {isCourseInPast ? (
                    <Chip label='Vergangen' color='default' size='small' />
                  ) : null}
                </Stack>

                {course.description ? (
                  <Stack spacing={2}>
                    <Typography variant='h5' component='h2'>
                      Kursbeschreibung
                    </Typography>
                    <Typography
                      variant='body1'
                      color='text.primary'
                      sx={{ whiteSpace: 'pre-wrap' }}
                    >
                      {course.description}
                    </Typography>
                  </Stack>
                ) : null}
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          {onBookNow || bookNowHref ? (
            <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 16 }}>
              <Stack spacing={3}>
                <Stack spacing={1}>
                  <Typography variant='h6'>Direkt buchen</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Sichere dir jetzt einen Platz in diesem Kurs.
                  </Typography>
                </Stack>

                <Button
                  variant='contained'
                  size='large'
                  startIcon={<BookOnlineOutlinedIcon />}
                  {...(bookNowHref
                    ? {
                        component: Link as React.ElementType,
                        href: bookNowHref,
                      }
                    : {})}
                  onClick={
                    typeof onBookNow === 'function' ? handleBookNow : undefined
                  }
                  disabled={isBookingDisabled}
                  title={disableReason ?? undefined}
                  aria-disabled={isBookingDisabled}
                  aria-busy={isBooking || undefined}
                  data-testid='course-detail-book-cta'
                >
                  {bookingButtonText}
                </Button>

                <Box component='span' aria-live='polite' sx={visuallyHidden}>
                  {isBooking ? 'Buchung läuft' : ''}
                </Box>

                {isBookingDisabled && disableReason ? (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    data-testid='course-detail-disable-reason'
                  >
                    {disableReason}
                  </Typography>
                ) : null}
              </Stack>
            </Paper>
          ) : null}
        </Grid>
      </Grid>
    </Container>
  );
};

export default CourseDetail;
