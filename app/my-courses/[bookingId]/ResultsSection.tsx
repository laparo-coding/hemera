/**
 * ResultsSection Component
 *
 * Displays participation results and summary for completed courses.
 * Used in the course detail page for courses with participation data.
 */

'use client';

import { CheckCircleOutlined, SchoolOutlined } from '@mui/icons-material';
import { Box, Divider, Paper, Stack, Typography } from '@mui/material';

// Design tokens
const colors = {
  petrol: '#16404D',
  gold: '#DDA853',
  sage: '#A6CDC6',
  white: '#FFFFFF',
} as const;

interface Participation {
  id: string;
  summary?: string | null;
  createdAt?: Date;
}

interface ResultsSectionProps {
  participation: Participation;
}

export default function ResultsSection({ participation }: ResultsSectionProps) {
  return (
    <Paper
      id='ergebnisse'
      elevation={0}
      data-testid='results-section'
      sx={{
        p: { xs: 3, md: 4 },
        mb: 3,
        borderRadius: '16px',
        border: '1px solid rgba(22, 64, 77, 0.1)',
        bgcolor: colors.white,
        scrollMarginTop: '80px',
      }}
    >
      <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 2 }}>
        <CheckCircleOutlined sx={{ color: colors.sage, fontSize: 28 }} />
        <Typography
          component='h2'
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: colors.petrol,
          }}
        >
          Teilnahme bestätigt
        </Typography>
      </Stack>

      <Divider sx={{ mb: 3, borderColor: 'rgba(22, 64, 77, 0.1)' }} />

      {participation.summary ? (
        <Box>
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: colors.petrol,
              opacity: 0.7,
              mb: 1,
            }}
          >
            Zusammenfassung
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '1rem',
              color: colors.petrol,
              lineHeight: 1.7,
            }}
          >
            {participation.summary}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <SchoolOutlined sx={{ fontSize: 48, color: colors.sage, mb: 2 }} />
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '1rem',
              color: colors.petrol,
              opacity: 0.7,
            }}
          >
            Du hast erfolgreich an diesem Seminar teilgenommen.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
