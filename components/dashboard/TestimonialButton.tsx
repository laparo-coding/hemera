'use client';

import { RateReviewOutlined } from '@mui/icons-material';
import { Box, Button, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const TestimonialDrawer = dynamic(() => import('./TestimonialDrawer'), {
  loading: () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 64,
      }}
    >
      <CircularProgress size={24} />
    </Box>
  ),
  ssr: false,
});

interface TestimonialButtonProps {
  bookingId: string;
  courseName: string;
  userProfile: {
    firstName: string | null;
    lastName: string | null;
    imageUrl?: string;
    city?: string;
  };
}

export default function TestimonialButton({
  bookingId,
  courseName,
  userProfile,
}: TestimonialButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant='outlined'
        color='primary'
        startIcon={<RateReviewOutlined />}
        onClick={() => setOpen(true)}
        sx={theme => ({
          typography: 'button',
          textTransform: 'none',
          borderRadius: theme.shape.borderRadius,
          px: 3,
          py: 1,
        })}
      >
        Erfahrungsbericht
      </Button>
      <TestimonialDrawer
        open={open}
        onClose={() => setOpen(false)}
        bookingId={bookingId}
        courseName={courseName}
        userProfile={userProfile}
      />
    </>
  );
}
