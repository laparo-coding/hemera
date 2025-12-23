/**
 * Geocoding Utility - Nominatim API wrapper
 * Feature: 015-course-locations
 * Task: T023
 */

import type {
  GeocodeRequest,
  GeocodeResponse,
} from '@/lib/schemas/location-schema';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'hemera-learning-platform/1.0 (contact@hemera.de)';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Geocode an address using OpenStreetMap Nominatim API
 * Rate limit: 1 request per second (enforced by caller or queue if needed)
 */
export async function geocodeAddress(
  request: GeocodeRequest
): Promise<GeocodeResponse> {
  try {
    // Build query string
    const queryParts = [request.address];
    if (request.zipCode) {
      queryParts.push(request.zipCode);
    }
    queryParts.push(request.city);
    queryParts.push('Germany'); // Default to Germany for this app

    const query = queryParts.join(', ');

    const url = new URL(NOMINATIM_BASE_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(
        `Nominatim API error: ${response.status} ${response.statusText}`
      );
      return {
        latitude: null,
        longitude: null,
        success: false,
      };
    }

    const results: NominatimResult[] = await response.json();

    if (results.length === 0) {
      return {
        latitude: null,
        longitude: null,
        success: false,
      };
    }

    const firstResult = results[0];
    return {
      latitude: parseFloat(firstResult.lat),
      longitude: parseFloat(firstResult.lon),
      success: true,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      latitude: null,
      longitude: null,
      success: false,
    };
  }
}

/**
 * Build Apple Maps URL for an address
 */
export function buildAppleMapsUrl(
  address: string,
  city: string,
  zipCode?: string | null
): string {
  const fullAddress = zipCode
    ? `${address}, ${zipCode} ${city}`
    : `${address}, ${city}`;
  return `https://maps.apple.com/?address=${encodeURIComponent(fullAddress)}`;
}

/**
 * Build Google Maps URL for an address
 */
export function buildGoogleMapsUrl(
  address: string,
  city: string,
  zipCode?: string | null
): string {
  const fullAddress = zipCode
    ? `${address}, ${zipCode} ${city}`
    : `${address}, ${city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
}
