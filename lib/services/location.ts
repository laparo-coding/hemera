/**
 * Location Service - Business logic for Location entity
 * Feature: 015-course-locations
 * Task: T024
 */

import type { Location, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type {
  GeocodeRequest,
  LocationInput,
  LocationListResponse,
  LocationResponse,
} from '@/lib/schemas/location-schema';
import { geocodeAddress } from '@/lib/utils/geocoding';

// Re-export Location type from Prisma
export type { Location } from '@prisma/client';

export interface LocationWithCount extends Location {
  _count?: {
    courses: number;
  };
}

export interface LocationDeleteError {
  code: 'LOCATION_HAS_REFERENCES';
  error: string;
  referencingCourses: Array<{ id: string; title: string }>;
}

/**
 * Generate URL-safe slug from location name
 * Matches Course entity pattern
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (ä → a, ö → o, etc.)
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-'); // Collapse multiple dashes
}

/**
 * Find a unique slug by appending numbers if necessary
 */
async function findUniqueSlug(
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.location.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (!existing) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * List all locations with course count
 */
export async function listLocations(): Promise<LocationListResponse> {
  const locations = await prisma.location.findMany({
    include: {
      _count: {
        select: { courses: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return {
    locations: locations.map(formatLocationResponse),
    total: locations.length,
  };
}

/**
 * Get a single location by ID
 */
export async function getLocationById(
  id: string
): Promise<LocationWithCount | null> {
  return prisma.location.findUnique({
    where: { id },
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });
}

/**
 * Get a single location by slug
 */
export async function getLocationBySlug(
  slug: string
): Promise<LocationWithCount | null> {
  return prisma.location.findFirst({
    where: { slug },
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });
}

/**
 * Create a new location with auto-generated slug and optional geocoding
 */
export async function createLocation(
  input: LocationInput,
  autoGeocode = true
): Promise<Location> {
  // Generate unique slug from name
  const baseSlug = generateSlug(input.name);
  const slug = await findUniqueSlug(baseSlug);

  // Optionally geocode the address
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (autoGeocode && input.address && input.city) {
    const geocodeResult = await geocodeAddress({
      address: input.address,
      city: input.city,
      zipCode: input.zipCode || undefined,
    });

    if (geocodeResult.success) {
      latitude = geocodeResult.latitude;
      longitude = geocodeResult.longitude;
    }
  }

  return prisma.location.create({
    data: {
      slug,
      name: input.name,
      description: input.description,
      address: input.address,
      zipCode: input.zipCode,
      city: input.city,
      email: input.email || null,
      phone: input.phone,
      website: input.website || null,
      imageUrl: input.imageUrl || null,
      roomImageUrl: input.roomImageUrl || null,
      latitude,
      longitude,
    },
  });
}

/**
 * Update an existing location
 * Regenerates slug if name changes
 */
export async function updateLocation(
  id: string,
  input: Partial<LocationInput>,
  autoGeocode = true
): Promise<Location> {
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Location not found');
  }

  // Prepare update data
  const updateData: Prisma.LocationUpdateInput = {};

  // Handle name change → regenerate slug
  if (input.name && input.name !== existing.name) {
    updateData.name = input.name;
    const baseSlug = generateSlug(input.name);
    updateData.slug = await findUniqueSlug(baseSlug, id);
  }

  // Copy other fields
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.address !== undefined) updateData.address = input.address;
  if (input.zipCode !== undefined) updateData.zipCode = input.zipCode;
  if (input.city !== undefined) updateData.city = input.city;
  if (input.email !== undefined) updateData.email = input.email || null;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.website !== undefined) updateData.website = input.website || null;
  if (input.imageUrl !== undefined)
    updateData.imageUrl = input.imageUrl || null;
  if (input.roomImageUrl !== undefined)
    updateData.roomImageUrl = input.roomImageUrl || null;

  // Geocode if address or city changed
  const addressChanged = input.address && input.address !== existing.address;
  const cityChanged = input.city && input.city !== existing.city;
  const zipCodeChanged =
    input.zipCode !== undefined && input.zipCode !== existing.zipCode;

  if (autoGeocode && (addressChanged || cityChanged || zipCodeChanged)) {
    const address = input.address || existing.address;
    const city = input.city || existing.city;
    const zipCode = input.zipCode ?? existing.zipCode;

    const geocodeResult = await geocodeAddress({
      address,
      city,
      zipCode: zipCode || undefined,
    });

    if (geocodeResult.success) {
      updateData.latitude = geocodeResult.latitude;
      updateData.longitude = geocodeResult.longitude;
    }
  }

  return prisma.location.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete a location
 * Throws error if courses reference this location
 */
export async function deleteLocation(
  id: string
): Promise<undefined | LocationDeleteError> {
  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      courses: {
        select: { id: true, title: true },
      },
      _count: {
        select: { courses: true },
      },
    },
  });

  if (!location) {
    throw new Error('Location not found');
  }

  if (location._count.courses > 0) {
    return {
      code: 'LOCATION_HAS_REFERENCES',
      error: 'Location is referenced by courses',
      referencingCourses: location.courses,
    };
  }

  await prisma.location.delete({ where: { id } });
}

/**
 * Geocode an address (standalone, for form preview)
 */
export async function geocodeLocationAddress(
  request: GeocodeRequest
): Promise<{
  latitude: number | null;
  longitude: number | null;
  success: boolean;
}> {
  return geocodeAddress(request);
}

/**
 * Format location for API response
 */
function formatLocationResponse(location: LocationWithCount): LocationResponse {
  return {
    id: location.id,
    slug: location.slug,
    name: location.name,
    description: location.description,
    address: location.address,
    zipCode: location.zipCode,
    city: location.city,
    email: location.email,
    phone: location.phone,
    website: location.website,
    imageUrl: location.imageUrl,
    roomImageUrl: location.roomImageUrl,
    latitude: location.latitude,
    longitude: location.longitude,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
    _count: location._count,
  };
}
