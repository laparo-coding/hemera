/**
 * TestimonialDrawer
 *
 * Right-anchored MUI Drawer for writing/editing testimonials.
 * Embeds the existing TestimonialForm component.
 * Opened via "Erfahrungsbericht" button on CourseCard.
 */

'use client';

import { useUser } from '@clerk/nextjs';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  Typography,
} from '@mui/material';
import type React from 'react';
import { colors } from '@/lib/design-tokens';
import TestimonialForm from '../testimonial/TestimonialForm';

export interface TestimonialDrawerProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  courseName: string;
  userProfile: {
    firstName: string | null;
    lastName: string | null;
    imageUrl?: string;
    city?: string;
  };
}

const TestimonialDrawer: React.FC<TestimonialDrawerProps> = ({
  open,
  onClose,
  bookingId,
  courseName,
  userProfile,
}) => {
  const { isSignedIn, isLoaded } = useUser();

  const isUnauthorized = isLoaded && !isSignedIn;

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      aria-labelledby='testimonial-drawer-title'
      data-testid='testimonial-drawer'
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          p: 0,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${colors.rosyBrown}`,
        }}
      >
        <Typography
          id='testimonial-drawer-title'
          variant='h6'
          sx={{ color: colors.marsala, fontWeight: 600 }}
        >
          Erfahrungsbericht
        </Typography>
        <IconButton onClick={onClose} aria-label='Schließen' size='small'>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2, overflow: 'auto' }}>
        {!isLoaded ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress
              size={28}
              role='status'
              aria-label='Authentifizierungsstatus wird geladen'
            />
          </Box>
        ) : isUnauthorized ? (
          <Alert severity='error'>
            Du musst angemeldet sein, um einen Erfahrungsbericht zu schreiben.
          </Alert>
        ) : (
          <TestimonialForm
            bookingId={bookingId}
            courseName={courseName}
            userProfile={{
              firstName: userProfile.firstName || '',
              lastName: userProfile.lastName || '',
              imageUrl: userProfile.imageUrl,
              city: userProfile.city,
            }}
            onSuccess={onClose}
          />
        )}
      </Box>
    </Drawer>
  );
};

export default TestimonialDrawer;
