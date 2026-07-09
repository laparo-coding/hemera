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
        onClick={() => {
          setOpen(true);
        }}
        sx={theme => ({
          fontFamily: theme.typography.body2.fontFamily,
          fontWeight: theme.typography.body2.fontWeight ?? 600,
          fontSize: theme.typography.body2.fontSize,
          lineHeight: theme.typography.body2.lineHeight,
          textTransform: 'none',
          borderRadius:
            typeof theme.shape.borderRadius === 'number'
              ? theme.shape.borderRadius * 2
              : `calc(${theme.shape.borderRadius} * 2)`,
          minHeight: theme.spacing(5),
          gap: theme.spacing(1),
          px: theme.spacing(3),
          py: theme.spacing(1),
          '& .MuiButton-startIcon': {
            margin: 0,
          },
        })}
      >
        Erfahrungsbericht
      </Button>
      <TestimonialDrawer
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        bookingId={bookingId}
        courseName={courseName}
        userProfile={userProfile}
      />
    </>
  );
}
