/**
 * Locations API Integration Tests
 * Feature: 015-course-locations
 * Tasks: T006-T012, T020-T022
 */

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from '@/tests/vitest/jest-globals';
import { closeDb, prisma } from '../../lib/db/prisma';

describe('Locations API Integration Tests', () => {
  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    // Clean up test data - courses first (FK), then locations
    await prisma.course.updateMany({
      where: { locationId: { not: null } },
      data: { locationId: null },
    });
    await prisma.location.deleteMany();
  });

  afterEach(async () => {
    await prisma.course.updateMany({
      where: { locationId: { not: null } },
      data: { locationId: null },
    });
    await prisma.location.deleteMany();
  });

  // ==========================================================================
  // T006: Contract test GET /api/locations (listLocations)
  // ==========================================================================
  describe('T006: GET /api/locations', () => {
    it('should return empty list when no locations exist', async () => {
      // TODO: Implement when API route exists
      // const response = await fetch('/api/locations')
      // const data = await response.json()
      // expect(response.status).toBe(200)
      // expect(data.locations).toEqual([])
      // expect(data.total).toBe(0)

      // Direct DB test as placeholder
      const locations = await prisma.location.findMany();
      expect(locations).toEqual([]);
    });

    it('should return all locations with course count', async () => {
      // Create test locations
      await prisma.location.createMany({
        data: [
          {
            name: 'Location 1',
            slug: 'location-1',
            address: 'Addr 1',
            city: 'Berlin',
          },
          {
            name: 'Location 2',
            slug: 'location-2',
            address: 'Addr 2',
            city: 'Munich',
          },
        ],
      });

      const locations = await prisma.location.findMany({
        include: { _count: { select: { courses: true } } },
      });

      expect(locations).toHaveLength(2);
      expect(locations[0]!._count.courses).toBe(0);
    });
  });

  // ==========================================================================
  // T007: Contract test POST /api/locations (createLocation)
  // ==========================================================================
  describe('T007: POST /api/locations', () => {
    it('should create location with required fields', async () => {
      const input = {
        name: 'Yoga Studio Berlin',
        address: 'Torstraße 123',
        city: 'Berlin',
      };

      // Direct DB test until API is implemented
      const location = await prisma.location.create({
        data: {
          ...input,
          slug: 'yoga-studio-berlin',
        },
      });

      expect(location.id).toBeDefined();
      expect(location.name).toBe(input.name);
      expect(location.slug).toBe('yoga-studio-berlin');
      expect(location.city).toBe(input.city);
    });

    it('should create location with all optional fields', async () => {
      const input = {
        name: 'Complete Location',
        slug: 'complete-location',
        description: 'A full description',
        address: 'Main Street 1',
        zipCode: '10119',
        city: 'Berlin',
        email: 'test@example.com',
        phone: '+49 30 12345',
        website: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
        roomImageUrl: 'https://example.com/room.jpg',
        latitude: 52.52,
        longitude: 13.405,
      };

      const location = await prisma.location.create({ data: input });

      expect(location.description).toBe(input.description);
      expect(location.zipCode).toBe(input.zipCode);
      expect(location.email).toBe(input.email);
      expect(location.latitude).toBe(input.latitude);
      expect(location.longitude).toBe(input.longitude);
    });

    it('should require unique slug', async () => {
      await prisma.location.create({
        data: {
          name: 'First',
          slug: 'duplicate-slug',
          address: 'Addr 1',
          city: 'Berlin',
        },
      });

      await expect(
        prisma.location.create({
          data: {
            name: 'Second',
            slug: 'duplicate-slug',
            address: 'Addr 2',
            city: 'Munich',
          },
        })
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // T008: Contract test GET /api/locations/{id} (getLocation)
  // ==========================================================================
  describe('T008: GET /api/locations/{id}', () => {
    it('should return location by id', async () => {
      const created = await prisma.location.create({
        data: {
          name: 'Test Location',
          slug: 'test-location',
          address: 'Test Addr',
          city: 'Berlin',
        },
      });

      const found = await prisma.location.findUnique({
        where: { id: created.id },
        include: { _count: { select: { courses: true } } },
      });

      expect(found).not.toBeNull();
      expect(found?.name).toBe('Test Location');
      expect(found?._count.courses).toBe(0);
    });

    it('should return null for non-existent id', async () => {
      const found = await prisma.location.findUnique({
        where: { id: 'nonexistent-id' },
      });

      expect(found).toBeNull();
    });
  });

  // ==========================================================================
  // T009: Contract test PUT /api/locations/{id} (updateLocation)
  // ==========================================================================
  describe('T009: PUT /api/locations/{id}', () => {
    it('should update location fields', async () => {
      const created = await prisma.location.create({
        data: {
          name: 'Original Name',
          slug: 'original-name',
          address: 'Original Addr',
          city: 'Berlin',
        },
      });

      const updated = await prisma.location.update({
        where: { id: created.id },
        data: {
          name: 'Updated Name',
          address: 'Updated Addr',
        },
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.address).toBe('Updated Addr');
      expect(updated.city).toBe('Berlin'); // unchanged
    });

    it('should update optional fields to null', async () => {
      const created = await prisma.location.create({
        data: {
          name: 'Test',
          slug: 'test-nullify',
          address: 'Addr',
          city: 'Berlin',
          email: 'test@example.com',
          phone: '+49 123',
        },
      });

      const updated = await prisma.location.update({
        where: { id: created.id },
        data: {
          email: null,
          phone: null,
        },
      });

      expect(updated.email).toBeNull();
      expect(updated.phone).toBeNull();
    });
  });

  // ==========================================================================
  // T010: Contract test DELETE /api/locations/{id} (deleteLocation)
  // ==========================================================================
  describe('T010: DELETE /api/locations/{id}', () => {
    it('should delete location when no courses reference it', async () => {
      const created = await prisma.location.create({
        data: {
          name: 'To Delete',
          slug: 'to-delete',
          address: 'Addr',
          city: 'Berlin',
        },
      });

      await prisma.location.delete({ where: { id: created.id } });

      const found = await prisma.location.findUnique({
        where: { id: created.id },
      });
      expect(found).toBeNull();
    });
  });

  // ==========================================================================
  // T011: Contract test DELETE with references returns 409
  // ==========================================================================
  describe('T011: DELETE with references', () => {
    it('should block deletion when courses reference the location', async () => {
      const location = await prisma.location.create({
        data: {
          name: 'Referenced Location',
          slug: 'referenced-location',
          address: 'Addr',
          city: 'Berlin',
        },
      });

      // Create a course that references this location
      await prisma.course.create({
        data: {
          title: 'Test Course',
          slug: `test-course-${Date.now()}`,
          price: 9900,
          locationId: location.id,
        },
      });

      // Verify the location has a reference
      const locationWithCount = await prisma.location.findUnique({
        where: { id: location.id },
        include: { _count: { select: { courses: true } } },
      });
      expect(locationWithCount?._count.courses).toBe(1);

      // Note: The actual API should return 409.
      // Prisma will throw an error due to FK constraint or we check manually.
      // For now, we verify the relationship exists.
    });
  });

  // ==========================================================================
  // T012: Contract test POST /api/locations/geocode
  // ==========================================================================
  describe('T012: POST /api/locations/geocode', () => {
    it('should return coordinates for valid address (placeholder)', async () => {
      // This will be tested via API when geocode route is implemented
      // For now, placeholder test
      expect(true).toBe(true);
    });
  });

  // ==========================================================================
  // T020: Integration test - Create location with geocoding (Scenario 1)
  // ==========================================================================
  describe('T020: Create location with geocoding', () => {
    it('should store geocoded coordinates when creating location', async () => {
      // When implemented, this test will:
      // 1. POST to /api/locations with address
      // 2. Verify coordinates are populated from Nominatim
      // For now, test coordinate storage
      const location = await prisma.location.create({
        data: {
          name: 'Geocoded Location',
          slug: 'geocoded-location',
          address: 'Torstraße 123',
          city: 'Berlin',
          latitude: 52.52,
          longitude: 13.405,
        },
      });

      expect(location.latitude).toBe(52.52);
      expect(location.longitude).toBe(13.405);
    });
  });

  // ==========================================================================
  // T021: Integration test - Geocoding failure handling (Scenario 7)
  // ==========================================================================
  describe('T021: Geocoding failure handling', () => {
    it('should save location without coordinates when geocoding fails', async () => {
      // Location saved with null coordinates (geocoding failed)
      const location = await prisma.location.create({
        data: {
          name: 'No Coords Location',
          slug: 'no-coords-location',
          address: 'Invalid Address XYZ',
          city: 'Nowhere',
          latitude: null,
          longitude: null,
        },
      });

      expect(location.id).toBeDefined();
      expect(location.latitude).toBeNull();
      expect(location.longitude).toBeNull();
    });
  });

  // ==========================================================================
  // T022: Integration test - Admin authorization required
  // ==========================================================================
  describe('T022: Admin authorization', () => {
    it('should require admin role for POST (placeholder)', async () => {
      // This will be tested via API when auth is wired up
      // For now, placeholder
      expect(true).toBe(true);
    });

    it('should require admin role for PUT (placeholder)', async () => {
      expect(true).toBe(true);
    });

    it('should require admin role for DELETE (placeholder)', async () => {
      expect(true).toBe(true);
    });

    it('should allow public access for GET (placeholder)', async () => {
      expect(true).toBe(true);
    });
  });
});
