'use client';

/**
 * LocationMap Component - Interactive map with React Leaflet
 * Feature: 015-course-locations
 * Task: T032
 *
 * IMPORTANT: This component must be loaded with dynamic import and ssr: false
 * Example: const LocationMap = dynamic(() => import('@/components/LocationMap'), { ssr: false })
 */

import { Box, Skeleton, Typography } from '@mui/material';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
// https://github.com/PaulLeCam/react-leaflet/issues/808
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface LocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
  height?: number | string;
  zoom?: number;
}

export default function LocationMap({
  latitude,
  longitude,
  name,
  address,
  height = 300,
  zoom = 15,
}: LocationMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Skeleton
        variant='rectangular'
        height={height}
        sx={{ borderRadius: 1 }}
      />
    );
  }

  return (
    <Box
      sx={{
        height,
        width: '100%',
        borderRadius: 1,
        overflow: 'hidden',
        '& .leaflet-container': {
          height: '100%',
          width: '100%',
        },
      }}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            <Typography variant='subtitle2' fontWeight='bold'>
              {name}
            </Typography>
            {address && (
              <Typography variant='body2' color='text.secondary'>
                {address}
              </Typography>
            )}
          </Popup>
        </Marker>
      </MapContainer>
    </Box>
  );
}
