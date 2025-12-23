/**
 * Public Location Landing Page
 * Feature: 015-course-locations
 * Task: T039-T040
 */

import {
  DirectionsCar as DirectionsIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  Phone as PhoneIcon,
  Place as PlaceIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';
import type { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import LocationMapWrapper from '@/components/LocationMapWrapper';
import { getLocationBySlug } from '@/lib/services/location';
import { buildAppleMapsUrl, buildGoogleMapsUrl } from '@/lib/utils/geocoding';

interface LocationPageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO (T040)
export async function generateMetadata(
  { params }: LocationPageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);

  if (!location) {
    return {
      title: 'Location nicht gefunden',
    };
  }

  const description = location.description
    ? location.description.substring(0, 160)
    : `Kursstandort ${location.name} in ${location.city}. ${location.address}`;

  return {
    title: `${location.name} | Kursstandort`,
    description,
    openGraph: {
      title: `${location.name} - Kursstandort`,
      description,
      type: 'website',
      ...(location.imageUrl && { images: [{ url: location.imageUrl }] }),
    },
    other: {
      'geo.placename': location.name,
      'geo.region': 'AT', // Austria
      ...(location.latitude && {
        'geo.position': `${location.latitude};${location.longitude}`,
      }),
    },
  };
}

// Map skeleton for loading
function MapSkeleton() {
  return (
    <Skeleton variant='rectangular' height={300} sx={{ borderRadius: 1 }} />
  );
}

async function LocationContent({ slug }: { slug: string }) {
  const location = await getLocationBySlug(slug);

  if (!location) {
    notFound();
  }

  const hasCoordinates =
    location.latitude !== null && location.longitude !== null;
  const courseCount = location._count?.courses ?? 0;

  // Build directions URLs
  const fullAddress =
    `${location.address}, ${location.zipCode ?? ''} ${location.city}`.trim();
  const appleMapsUrl = hasCoordinates
    ? buildAppleMapsUrl(location.latitude!, location.longitude!, location.name)
    : `https://maps.apple.com/?q=${encodeURIComponent(fullAddress)}`;
  const googleMapsUrl = hasCoordinates
    ? buildGoogleMapsUrl(location.latitude!, location.longitude!, location.name)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <>
      {/* Hero Section with Image */}
      {location.imageUrl && (
        <Box
          sx={{
            position: 'relative',
            height: { xs: 200, md: 300 },
            mb: 4,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Image
            src={location.imageUrl}
            alt={location.name}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </Box>
      )}

      {/* Title and Description */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h3' component='h1' gutterBottom>
          {location.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PlaceIcon color='action' />
          <Typography variant='h6' color='text.secondary'>
            {location.city}
          </Typography>
          {courseCount > 0 && (
            <Chip
              icon={<SchoolIcon />}
              label={`${courseCount} Kurs${courseCount !== 1 ? 'e' : ''}`}
              size='small'
              color='primary'
              variant='outlined'
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        {location.description && (
          <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
            {location.description}
          </Typography>
        )}
      </Box>

      <Grid container spacing={4}>
        {/* Map Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant='h6' gutterBottom>
              Standort
            </Typography>
            {hasCoordinates ? (
              <Suspense fallback={<MapSkeleton />}>
                <LocationMapWrapper
                  latitude={location.latitude!}
                  longitude={location.longitude!}
                  name={location.name}
                  address={fullAddress}
                  height='300px'
                />
              </Suspense>
            ) : (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                }}
              >
                <Typography color='text.secondary'>
                  Kartenansicht nicht verfügbar
                </Typography>
              </Box>
            )}

            {/* Directions Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant='outlined'
                startIcon={<DirectionsIcon />}
                href={googleMapsUrl}
                target='_blank'
                rel='noopener noreferrer'
              >
                Google Maps
              </Button>
              <Button
                variant='outlined'
                startIcon={<DirectionsIcon />}
                href={appleMapsUrl}
                target='_blank'
                rel='noopener noreferrer'
              >
                Apple Maps
              </Button>
            </Box>
          </Paper>

          {/* Room Image */}
          {location.roomImageUrl && (
            <Paper sx={{ p: 2, mt: 3 }}>
              <Typography variant='h6' gutterBottom>
                Räumlichkeiten
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 200, md: 250 },
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={location.roomImageUrl}
                  alt={`Räumlichkeiten ${location.name}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Contact Information Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 16 }}>
            <Typography variant='h6' gutterBottom>
              Kontakt & Adresse
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Address */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <PlaceIcon color='action' sx={{ mt: 0.5 }} />
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Adresse
                </Typography>
                <Typography variant='body1'>
                  {location.address}
                  <br />
                  {location.zipCode && `${location.zipCode} `}
                  {location.city}
                </Typography>
              </Box>
            </Box>

            {/* Email */}
            {location.email && (
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <EmailIcon color='action' sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    E-Mail
                  </Typography>
                  <Typography
                    component='a'
                    href={`mailto:${location.email}`}
                    sx={{ textDecoration: 'none', color: 'primary.main' }}
                  >
                    {location.email}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Phone */}
            {location.phone && (
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <PhoneIcon color='action' sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Telefon
                  </Typography>
                  <Typography
                    component='a'
                    href={`tel:${location.phone.replace(/\s/g, '')}`}
                    sx={{ textDecoration: 'none', color: 'primary.main' }}
                  >
                    {location.phone}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Website */}
            {location.website && (
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <LanguageIcon color='action' sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Website
                  </Typography>
                  <Typography
                    component='a'
                    href={location.website}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{ textDecoration: 'none', color: 'primary.main' }}
                  >
                    {location.website.replace(/^https?:\/\//, '')}
                  </Typography>
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* CTA to courses */}
            {courseCount > 0 && (
              <Link
                href={`/courses?location=${location.slug}`}
                passHref
                legacyBehavior
              >
                <Button
                  component='a'
                  variant='contained'
                  fullWidth
                  startIcon={<SchoolIcon />}
                >
                  Kurse an diesem Standort
                </Button>
              </Link>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { slug } = await params;

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Suspense
        fallback={
          <Box>
            <Skeleton
              variant='rectangular'
              height={300}
              sx={{ mb: 4, borderRadius: 2 }}
            />
            <Skeleton variant='text' width={300} height={48} />
            <Skeleton variant='text' width={200} height={32} sx={{ mb: 2 }} />
            <Skeleton
              variant='rectangular'
              height={400}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        }
      >
        <LocationContent slug={slug} />
      </Suspense>
    </Container>
  );
}
