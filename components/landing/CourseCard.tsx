'use client';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import Link from 'next/link';

export interface CourseDate {
  /** Start date */
  date: Date;
  /** Formatted date (e.g., "15. Januar 2025") */
  formattedDate: string;
  /** Start time (e.g., "10:00") */
  startTime?: string;
  /** End time (e.g., "17:00") */
  endTime?: string;
  /** Available spots (optional) */
  availableSpots?: number;
}

export interface CourseLocation {
  /** Location name */
  name: string;
  /** Location slug for URL */
  slug: string;
  /** City name */
  city: string;
}

export interface CourseCardProps {
  /** Course ID for link to detail page */
  courseId: string;
  /** Course identifier: A, B, or C */
  level: 'A' | 'B' | 'C';
  /** Level designation */
  levelLabel: 'Basis' | 'Fortgeschrittene' | 'Masterclass';
  /** Course title (German) */
  title: string;
  /** Brief description (German, informal "Du") */
  description: string;
  /** Upcoming course dates (max. 3) */
  upcomingDates: CourseDate[];
  /** Link to detail page */
  detailHref: string;
  /** CTA text for button */
  ctaText?: string;
  /** Location information (optional) */
  location?: CourseLocation | null;
  /** Thumbnail image URL (optional) */
  thumbnailUrl?: string | null;
}

// Design tokens from spec
const colors = {
  cream: '#FBF5DD',
  petrol: '#16404D',
  gold: '#DDA853',
  sage: '#A6CDC6',
};

const levelColors = {
  A: colors.sage,
  B: colors.gold,
  C: colors.petrol,
};

export default function CourseCard({
  level,
  levelLabel,
  title,
  description,
  upcomingDates,
  detailHref,
  ctaText = 'Mehr erfahren',
  location,
  thumbnailUrl,
}: CourseCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '16px',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'rgba(22, 64, 77, 0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(22, 64, 77, 0.1)',
        },
      }}
    >
      {/* Thumbnail image or Level indicator bar */}
      {thumbnailUrl ? (
        <Box
          sx={{
            position: 'relative',
            height: 160,
            overflow: 'hidden',
          }}
        >
          <Box
            component='img'
            src={thumbnailUrl}
            alt={title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Level indicator overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '6px',
              bgcolor: levelColors[level],
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            height: '6px',
            bgcolor: levelColors[level],
          }}
        />
      )}

      <Box
        sx={{
          p: { xs: 3, md: 4 },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Level chip */}
        <Chip
          label={levelLabel}
          size='small'
          sx={{
            alignSelf: 'flex-start',
            mb: 2,
            bgcolor: `${levelColors[level]}20`,
            color: colors.petrol,
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />

        {/* Title */}
        <Typography
          variant='h3'
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: colors.petrol,
            mb: 2,
          }}
        >
          {title}
        </Typography>

        {/* Description */}
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '1rem',
            lineHeight: 1.6,
            color: colors.petrol,
            opacity: 0.85,
            mb: 3,
            flexGrow: 1,
          }}
        >
          {description}
        </Typography>

        {/* Upcoming dates with time */}
        {upcomingDates.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {upcomingDates.slice(0, 3).map((courseDate, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  mb: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayIcon
                    sx={{
                      fontSize: '1rem',
                      color: colors.petrol,
                      opacity: 0.6,
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '0.875rem',
                      color: colors.petrol,
                      fontWeight: 500,
                    }}
                  >
                    {courseDate.formattedDate}
                  </Typography>
                </Box>
                {(courseDate.startTime || courseDate.endTime) && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      ml: 0,
                    }}
                  >
                    <AccessTimeIcon
                      sx={{
                        fontSize: '1rem',
                        color: colors.petrol,
                        opacity: 0.6,
                      }}
                    />
                    <Typography
                      sx={{
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '0.875rem',
                        color: colors.petrol,
                        opacity: 0.75,
                      }}
                    >
                      {courseDate.startTime}
                      {courseDate.endTime && ` – ${courseDate.endTime}`} Uhr
                    </Typography>
                  </Box>
                )}
                {courseDate.availableSpots !== undefined && (
                  <Typography
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '0.75rem',
                      color: colors.gold,
                      fontWeight: 500,
                      ml: 2.5,
                    }}
                  >
                    ({courseDate.availableSpots} Plätze frei)
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Location with link */}
        {location && (
          <Box sx={{ mb: 3 }}>
            <Link
              href={`/locations/${location.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: colors.petrol,
                  '&:hover': {
                    color: colors.gold,
                  },
                  transition: 'color 0.2s ease',
                }}
              >
                <LocationOnIcon sx={{ fontSize: '1rem', opacity: 0.6 }} />
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {location.name}, {location.city}
                </Typography>
              </Box>
            </Link>
          </Box>
        )}

        {/* CTA Button */}
        <Button
          component={Link}
          href={detailHref}
          variant='contained'
          color='primary'
          fullWidth
          sx={{
            fontWeight: 600,
            py: 1.5,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: '8px',
          }}
        >
          {ctaText}
        </Button>
      </Box>
    </Paper>
  );
}
