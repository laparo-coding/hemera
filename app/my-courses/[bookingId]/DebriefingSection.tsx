/**
 * DebriefingSection Component
 *
 * Displays debriefing materials and video content for completed courses.
 * Used in the course detail page for courses with participation.
 */

'use client';

import { PlayCircleOutlined, VideoLibraryOutlined } from '@mui/icons-material';
import { Box, Divider, Paper, Stack, Typography } from '@mui/material';
import { colors } from '@/lib/design-tokens';

interface DebriefingSectionProps {
  courseId: string;
  bookingId: string;
}

export default function DebriefingSection({
  courseId: _courseId,
  bookingId: _bookingId,
}: DebriefingSectionProps) {
  // In the future, this could fetch debriefing videos or documents
  // For now, we show a placeholder

  return (
    <Paper
      id='nachbereitung'
      elevation={0}
      data-testid='debriefing-section'
      sx={{
        p: { xs: 3, md: 4 },
        mb: 3,
        borderRadius: '16px',
        border: '1px solid rgba(136, 65, 67, 0.1)',
        bgcolor: colors.white,
        scrollMarginTop: '80px',
      }}
    >
      <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 2 }}>
        <VideoLibraryOutlined sx={{ color: colors.bronze, fontSize: 28 }} />
        <Typography
          component='h2'
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: colors.marsala,
          }}
        >
          Nachbereitung
        </Typography>
      </Stack>

      <Divider sx={{ mb: 3, borderColor: 'rgba(136, 65, 67, 0.1)' }} />

      <Box sx={{ textAlign: 'center', py: 4 }}>
        <PlayCircleOutlined
          sx={{ fontSize: 64, color: colors.rosyBrown, mb: 2, opacity: 0.5 }}
        />
        <Typography
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: colors.marsala,
            mb: 1,
          }}
        >
          Bald verfügbar
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '1rem',
            color: colors.lightBlack,
            opacity: 0.7,
            maxWidth: 400,
            mx: 'auto',
          }}
        >
          Hier findest du bald Nachbereitungsmaterialien und Videoaufzeichnungen
          zu deinem Seminar.
        </Typography>
      </Box>
    </Paper>
  );
}
