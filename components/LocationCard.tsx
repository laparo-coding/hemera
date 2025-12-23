'use client';

/**
 * LocationCard Component - Reusable location display card
 * Feature: 015-course-locations
 * Task: T033
 */

import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Place as PlaceIcon,
  Language as WebsiteIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import type { LocationResponse } from '@/lib/schemas/location-schema';

interface LocationCardProps {
  location: LocationResponse;
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function LocationCard({
  location,
  showActions = false,
  onEdit,
  onDelete,
}: LocationCardProps) {
  const courseCount = location._count?.courses ?? 0;
  const fullAddress = location.zipCode
    ? `${location.address}, ${location.zipCode} ${location.city}`
    : `${location.address}, ${location.city}`;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      {location.imageUrl && (
        <CardMedia
          component='img'
          height='140'
          image={location.imageUrl}
          alt={`${location.name} - Außenansicht`}
          sx={{ objectFit: 'cover' }}
        />
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
          }}
        >
          <Link
            href={`/locations/${location.slug}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Typography
              variant='h6'
              component='h3'
              sx={{
                '&:hover': { color: 'primary.main' },
              }}
            >
              {location.name}
            </Typography>
          </Link>

          {showActions && (
            <Stack direction='row' spacing={0.5}>
              {onEdit && (
                <Tooltip title='Bearbeiten'>
                  <IconButton
                    size='small'
                    onClick={() => onEdit(location.id)}
                    aria-label={`${location.name} bearbeiten`}
                  >
                    <EditIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title='Löschen'>
                  <IconButton
                    size='small'
                    onClick={() => onDelete(location.id)}
                    aria-label={`${location.name} löschen`}
                    color='error'
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}
        </Box>

        <Stack spacing={1}>
          {/* Address */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <PlaceIcon fontSize='small' color='action' sx={{ mt: 0.3 }} />
            <Typography variant='body2' color='text.secondary'>
              {fullAddress}
            </Typography>
          </Box>

          {/* Contact Info */}
          {location.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon fontSize='small' color='action' />
              <Typography
                variant='body2'
                component='a'
                href={`tel:${location.phone}`}
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {location.phone}
              </Typography>
            </Box>
          )}

          {location.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon fontSize='small' color='action' />
              <Typography
                variant='body2'
                component='a'
                href={`mailto:${location.email}`}
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {location.email}
              </Typography>
            </Box>
          )}

          {location.website && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WebsiteIcon fontSize='small' color='action' />
              <Typography
                variant='body2'
                component='a'
                href={location.website}
                target='_blank'
                rel='noopener noreferrer'
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Website
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Course count chip */}
        {courseCount > 0 && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={`${courseCount} ${courseCount === 1 ? 'Kurs' : 'Kurse'}`}
              size='small'
              color='primary'
              variant='outlined'
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
