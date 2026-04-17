'use client';

import { Box, Typography } from '@mui/material';
import CourseProgressStepper from '@/components/dashboard/CourseProgressStepper';
import type { ParticipationStatus } from '@/lib/types/participation';

const statuses: (ParticipationStatus | null)[] = [
  null,
  'PREPARATION',
  'SUMMARY',
  'DEBRIEFING',
  'RESULT',
  'COMPLETE',
];

export default function StepperDebugClient() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h5' gutterBottom>
        Schritt-fuer-Schritt-Debugging
      </Typography>
      {statuses.map(status => (
        <Box key={status ?? 'null'} sx={{ mb: 4 }}>
          <Typography variant='subtitle2' sx={{ mb: 1 }}>
            Status: {status ?? 'null'}
          </Typography>
          <CourseProgressStepper
            bookingId='debug-booking'
            participationStatus={status}
            courseStartDate='2026-06-01T09:00:00Z'
          />
        </Box>
      ))}
    </Box>
  );
}
