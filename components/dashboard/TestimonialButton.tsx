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
        startIcon={<RateReviewOutlined />}
        onClick={() => setOpen(true)}
        sx={{
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
          fontSize: '0.875rem',
          lineHeight: 1.5,
          textTransform: 'none',
          borderRadius: '8px',
          minHeight: 40,
          gap: 1,
          px: 3,
          py: 1,
          '& .MuiButton-startIcon': {
            margin: 0,
          },
        }}
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
