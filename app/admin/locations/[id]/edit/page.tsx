/**
 * Admin Edit Location Page (Server Component)
 * Feature: 015-course-locations
 *
 * Note: Admin authentication is handled by the parent layout.
 * This page follows the Server Component + Client Child pattern.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocationById } from '@/lib/services/location';
import EditLocationClient from './EditLocationClient';

export const metadata: Metadata = {
  title: 'Location bearbeiten | Admin',
  description: 'Kursstandort bearbeiten',
};

interface EditLocationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLocationPage({
  params,
}: EditLocationPageProps) {
  const { id } = await params;
  const location = await getLocationById(id);

  if (!location) {
    notFound();
  }

  // Transform to the format expected by the client component
  const locationData = {
    id: location.id,
    name: location.name,
    description: location.description ?? undefined,
    address: location.address,
    zipCode: location.zipCode ?? undefined,
    city: location.city,
    email: location.email ?? undefined,
    phone: location.phone ?? undefined,
    website: location.website ?? undefined,
    imageUrl: location.imageUrl ?? undefined,
    roomImageUrl: location.roomImageUrl ?? undefined,
    latitude: location.latitude ?? undefined,
    longitude: location.longitude ?? undefined,
  };

  return <EditLocationClient initialLocation={locationData} />;
}
