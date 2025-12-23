'use client';

/**
 * LocationMapWrapper - Client component wrapper for dynamic map loading
 * Feature: 015-course-locations
 */

import { Skeleton } from '@mui/material';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/LocationMap'), {
  ssr: false,
  loading: () => (
    <Skeleton variant='rectangular' height={300} sx={{ borderRadius: 1 }} />
  ),
});

interface LocationMapWrapperProps {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  height?: string;
}

export default function LocationMapWrapper({
  latitude,
  longitude,
  name,
  address,
  height = '300px',
}: LocationMapWrapperProps) {
  return (
    <LocationMap
      latitude={latitude}
      longitude={longitude}
      name={name}
      address={address}
      height={height}
    />
  );
}
