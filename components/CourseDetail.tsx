'use client';

import BookOnlineOutlinedIcon from '@mui/icons-material/BookOnlineOutlined';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  SvgIcon,
  type SvgIconProps,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

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
  price: number | null;
  currency: string;
  capacity?: number | null;
  startDate?: Date | null;
  startTime?: Date | null;
  endTime?: Date | null;
  isPublished: boolean;
  thumbnailUrl?: string | null;
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
    const euros = amount / 100;
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: Number.isInteger(euros) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(euros);
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
    const dateValue =
      course.startDate instanceof Date
        ? course.startDate
        : new Date(course.startDate);
    if (!Number.isFinite(dateValue.getTime())) return null;
    return format(dateValue, 'PPP', { locale: de });
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
    return `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
  }, [course.startTime, course.endTime]);

  if (isLoading) {
    return (
      <Card aria-busy='true' aria-live='polite' sx={{ p: 3 }}>
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
      </Card>
    );
  }

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 8, md: 10 },
        pb: { xs: 3, md: 4 },
      }}
    >
      <Grid container spacing={4} alignItems='flex-start'>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            {course.thumbnailUrl ? (
              <CardMedia sx={{ position: 'relative', aspectRatio: '21 / 9' }}>
                <Image
                  src={course.thumbnailUrl}
                  alt={course.title}
                  fill
                  sizes='(min-width: 1200px) 720px, 100vw'
                  style={{ objectFit: 'cover' }}
                />
              </CardMedia>
            ) : (
              <Box
                sx={{
                  height: 120,
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
            <CardContent>
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
                    <Typography
                      variant='body1'
                      sx={{ mt: 1, color: 'text.secondary' }}
                    >
                      👤 Dozent: {course.instructor}
                    </Typography>
                  )}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ mt: 2, color: 'text.secondary' }}
                  >
                    {formattedDate && (
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <CalendarMonthRoundedIcon fontSize='small' />
                        <Typography variant='body2'>
                          {formattedDate}
                          {formattedTime && ` · ${formattedTime}`}
                        </Typography>
                      </Stack>
                    )}
                    {course.capacity ? (
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <GroupRoundedIcon fontSize='small' />
                        <Typography variant='body2'>
                          {course.availableSpots !== null
                            ? `${course.availableSpots} von ${course.capacity} Plätzen verfügbar`
                            : `${course.capacity} Plätze`}
                        </Typography>
                      </Stack>
                    ) : null}
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <CoinIcon fontSize='small' />
                      <Typography variant='body2'>
                        {formatCurrency(course.price, course.currency)}
                      </Typography>
                    </Stack>
                    {course.location && (
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <LocationOnRoundedIcon fontSize='small' />
                        <Link
                          href={`/locations/${course.location.slug}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Typography
                            variant='body2'
                            sx={{
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
                  </Stack>
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

                <Divider />

                <Stack spacing={2}>
                  <Typography variant='h6' component='h3'>
                    Buchungsinformationen
                  </Typography>
                  <List disablePadding>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemIcon
                        sx={{ minWidth: 32, color: 'text.secondary' }}
                      >
                        <CoinIcon fontSize='small' />
                      </ListItemIcon>
                      <ListItemText
                        primary='Preis'
                        secondary={formatCurrency(
                          course.price,
                          course.currency
                        )}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                        }}
                        secondaryTypographyProps={{
                          variant: 'subtitle1',
                          color: 'text.primary',
                          fontWeight: 600,
                        }}
                      />
                    </ListItem>
                    {course.capacity ? (
                      <ListItem disableGutters sx={{ py: 1 }}>
                        <ListItemIcon
                          sx={{ minWidth: 32, color: 'text.secondary' }}
                        >
                          <GroupRoundedIcon fontSize='small' />
                        </ListItemIcon>
                        <ListItemText
                          primary='Verfügbare Plätze'
                          secondary={course.availableSpots ?? course.capacity}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                          }}
                          secondaryTypographyProps={{
                            variant: 'subtitle1',
                            color: 'text.primary',
                            fontWeight: 600,
                          }}
                        />
                      </ListItem>
                    ) : null}
                    {course.totalBookings !== undefined ? (
                      <ListItem disableGutters sx={{ py: 1 }}>
                        <ListItemIcon
                          sx={{ minWidth: 32, color: 'text.secondary' }}
                        >
                          <HistoryEduRoundedIcon fontSize='small' />
                        </ListItemIcon>
                        <ListItemText
                          primary='Bereits gebucht'
                          secondary={course.totalBookings}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                          }}
                          secondaryTypographyProps={{
                            variant: 'subtitle1',
                            color: 'text.primary',
                            fontWeight: 600,
                          }}
                        />
                      </ListItem>
                    ) : null}
                  </List>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          {onBookNow || bookNowHref ? (
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
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
                      typeof onBookNow === 'function'
                        ? handleBookNow
                        : undefined
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
              </CardContent>
            </Card>
          ) : null}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourseDetail;
