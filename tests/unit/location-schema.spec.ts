/**
 * Location Schema Unit Tests
 * Feature: 015-course-locations
 * Tasks: T013-T016
 */

import { describe, expect, it } from '@/tests/vitest/jest-globals';
import {
  geocodeRequestSchema,
  locationCreateSchema,
  locationSchema,
  locationUpdateSchema,
} from '@/lib/schemas/location-schema';

describe('locationSchema', () => {
  describe('T013: required field validation', () => {
    it('should require name field', () => {
      const result = locationSchema.safeParse({
        address: 'Test Street 1',
        city: 'Berlin',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('name'))).toBe(
          true
        );
      }
    });

    it('should require address field', () => {
      const result = locationSchema.safeParse({
        name: 'Test Location',
        city: 'Berlin',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('address'))).toBe(
          true
        );
      }
    });

    it('should require city field', () => {
      const result = locationSchema.safeParse({
        name: 'Test Location',
        address: 'Test Street 1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('city'))).toBe(
          true
        );
      }
    });

    it('should accept valid minimal input', () => {
      const result = locationSchema.safeParse({
        name: 'Test Location',
        address: 'Test Street 1',
        city: 'Berlin',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('T013: max length validation', () => {
    it('should reject name exceeding 200 characters', () => {
      const result = locationSchema.safeParse({
        name: 'a'.repeat(201),
        address: 'Test Street 1',
        city: 'Berlin',
      });
      expect(result.success).toBe(false);
    });

    it('should reject address exceeding 500 characters', () => {
      const result = locationSchema.safeParse({
        name: 'Test',
        address: 'a'.repeat(501),
        city: 'Berlin',
      });
      expect(result.success).toBe(false);
    });

    it('should reject city exceeding 100 characters', () => {
      const result = locationSchema.safeParse({
        name: 'Test',
        address: 'Test Street 1',
        city: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should reject description exceeding 2000 characters', () => {
      const result = locationSchema.safeParse({
        name: 'Test',
        address: 'Test Street 1',
        city: 'Berlin',
        description: 'a'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('T013: email validation', () => {
    it('should accept valid email', () => {
      const result = locationSchema.safeParse({
        name: 'Test',
        address: 'Test Street 1',
        city: 'Berlin',
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = locationSchema.safeParse({
        name: 'Test',
        address: 'Test Street 1',
        city: 'Berlin',
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty string for email', () => {
      const result = locationSchema.safeParse({
        name: 'Test',
        address: 'Test Street 1',
        city: 'Berlin',
        email: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('T013: URL validation', () => {
    it('should accept valid website URL', () => {
      const result = locationSchema.safeParse({
        name: 'Test',
        address: 'Test Street 1',
        city: 'Berlin',
        website: 'https://example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid website URL', () => {
      const result = locationSchema.safeParse({
        name: 'Test',
        address: 'Test Street 1',
        city: 'Berlin',
        website: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid imageUrl', () => {
      const result = locationSchema.safeParse({
        name: 'Test',
        address: 'Test Street 1',
        city: 'Berlin',
        imageUrl: 'https://example.com/image.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid roomImageUrl', () => {
      const result = locationSchema.safeParse({
        name: 'Test',
        address: 'Test Street 1',
        city: 'Berlin',
        roomImageUrl: 'https://example.com/room.jpg',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('T013: optional field handling', () => {
    it('should accept full valid input', () => {
      const result = locationSchema.safeParse({
        name: 'Yoga Studio Berlin',
        description: 'A beautiful yoga studio',
        address: 'Torstraße 123',
        zipCode: '10119',
        city: 'Berlin',
        email: 'info@yoga-studio.de',
        phone: '+49 30 12345678',
        website: 'https://yoga-studio.de',
        imageUrl: 'https://example.com/exterior.jpg',
        roomImageUrl: 'https://example.com/room.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should accept null for optional fields', () => {
      const result = locationSchema.safeParse({
        name: 'Test',
        address: 'Test Street 1',
        city: 'Berlin',
        description: null,
        zipCode: null,
        email: null,
        phone: null,
        website: null,
        imageUrl: null,
        roomImageUrl: null,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('locationCreateSchema', () => {
  describe('T014: create schema validation', () => {
    it('should have same validation as base schema', () => {
      const result = locationCreateSchema.safeParse({
        name: 'Test Location',
        address: 'Test Street 1',
        city: 'Berlin',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid input', () => {
      const result = locationCreateSchema.safeParse({
        name: '',
        address: '',
        city: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('locationUpdateSchema', () => {
  describe('T015: partial update validation', () => {
    it('should allow partial updates with only name', () => {
      const result = locationUpdateSchema.safeParse({
        name: 'Updated Name',
      });
      expect(result.success).toBe(true);
    });

    it('should allow partial updates with only address', () => {
      const result = locationUpdateSchema.safeParse({
        address: 'New Address 456',
      });
      expect(result.success).toBe(true);
    });

    it('should allow partial updates with only city', () => {
      const result = locationUpdateSchema.safeParse({
        city: 'Munich',
      });
      expect(result.success).toBe(true);
    });

    it('should allow empty object for no changes', () => {
      const result = locationUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should still validate field constraints', () => {
      const result = locationUpdateSchema.safeParse({
        name: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('geocodeRequestSchema', () => {
  describe('T016: geocode request validation', () => {
    it('should require address and city', () => {
      const result = geocodeRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept valid geocode request', () => {
      const result = geocodeRequestSchema.safeParse({
        address: 'Torstraße 123',
        city: 'Berlin',
      });
      expect(result.success).toBe(true);
    });

    it('should accept geocode request with optional zipCode', () => {
      const result = geocodeRequestSchema.safeParse({
        address: 'Torstraße 123',
        city: 'Berlin',
        zipCode: '10119',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty address', () => {
      const result = geocodeRequestSchema.safeParse({
        address: '',
        city: 'Berlin',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty city', () => {
      const result = geocodeRequestSchema.safeParse({
        address: 'Torstraße 123',
        city: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
