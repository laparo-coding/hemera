'use client';

/**
 * TestimonialCard Component - Display a single testimonial
 * Feature: 017-testimonial-management
 */

import { FormatQuote as QuoteIcon } from '@mui/icons-material';
import { Avatar, Box, Card, CardContent, Typography } from '@mui/material';
import type { PublicTestimonialApiResponse } from '@/lib/types/testimonial';

interface TestimonialCardProps {
  testimonial: PublicTestimonialApiResponse;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pt: 4 }}>
        {/* Quote icon */}
        <QuoteIcon
          sx={{
            position: 'absolute',
            top: 12,
            left: 16,
            fontSize: 32,
            color: 'primary.light',
            opacity: 0.5,
          }}
        />

        {/* Statement */}
        <Typography
          variant='body1'
          sx={{
            fontStyle: 'italic',
            mb: 3,
            lineHeight: 1.7,
            color: 'text.secondary',
          }}
        >
          &ldquo;{testimonial.statement}&rdquo;
        </Typography>

        {/* Author */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={testimonial.photoUrl || undefined}
            alt={testimonial.displayName}
            sx={{ width: 48, height: 48 }}
          >
            {testimonial.displayName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant='subtitle2' fontWeight='bold'>
              {testimonial.displayName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {new Date(testimonial.createdAt).toLocaleDateString('de-DE', {
                year: 'numeric',
                month: 'long',
              })}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
