'use client';

import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import Link from 'next/link';

export interface CourseDate {
  /** Start date */
  date: Date;
  /** Formatted date (e.g., "15. Januar 2025") */
  formattedDate: string;
  /** Available spots (optional) */
  availableSpots?: number;
}

export interface CourseCardProps {
  /** Course ID for link to detail page */
  courseId: string;
  /** Course identifier: A, B, or C */
  level: 'A' | 'B' | 'C';
  /** Level designation */
  levelLabel: 'Grundkurs' | 'Fortgeschrittene' | 'Masterclass';
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
      {/* Level indicator bar */}
      <Box
        sx={{
          height: '6px',
          bgcolor: levelColors[level],
        }}
      />

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

        {/* Upcoming dates */}
        {upcomingDates.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: colors.petrol,
                mb: 1,
              }}
            >
              Nächste Termine:
            </Typography>
            {upcomingDates.slice(0, 3).map((courseDate, index) => (
              <Typography
                key={index}
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.875rem',
                  color: colors.petrol,
                  opacity: 0.75,
                }}
              >
                {courseDate.formattedDate}
                {courseDate.availableSpots !== undefined && (
                  <span style={{ marginLeft: '8px', color: colors.gold }}>
                    ({courseDate.availableSpots} Plätze frei)
                  </span>
                )}
              </Typography>
            ))}
          </Box>
        )}

        {/* CTA Button */}
        <Button
          component={Link}
          href={detailHref}
          variant='contained'
          fullWidth
          sx={{
            bgcolor: colors.gold,
            color: colors.petrol,
            fontWeight: 600,
            py: 1.5,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: '8px',
            '&:hover': {
              bgcolor: '#C99545',
            },
          }}
        >
          {ctaText}
        </Button>
      </Box>
    </Paper>
  );
}
