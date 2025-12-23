/**
 * Location Schemas - Zod validation schemas for Location entity
 * Feature: 015-course-locations
 */

import { z } from 'zod';

// Base schema for location fields
export const locationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(200, 'Name darf maximal 200 Zeichen haben'),
  description: z
    .string()
    .max(2000, 'Beschreibung darf maximal 2000 Zeichen haben')
    .optional()
    .nullable(),
  address: z
    .string()
    .min(1, 'Adresse ist erforderlich')
    .max(500, 'Adresse darf maximal 500 Zeichen haben'),
  zipCode: z
    .string()
    .max(20, 'PLZ darf maximal 20 Zeichen haben')
    .optional()
    .nullable(),
  city: z
    .string()
    .min(1, 'Stadt ist erforderlich')
    .max(100, 'Stadt darf maximal 100 Zeichen haben'),
  email: z
    .string()
    .email('Ungültige E-Mail-Adresse')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .max(50, 'Telefonnummer darf maximal 50 Zeichen haben')
    .optional()
    .nullable(),
  website: z
    .string()
    .url('Ungültige Website-URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  imageUrl: z
    .string()
    .url('Ungültige Bild-URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  roomImageUrl: z
    .string()
    .url('Ungültige Raumbild-URL')
    .optional()
    .nullable()
    .or(z.literal('')),
});

// Schema for creating a new location
export const locationCreateSchema = locationSchema;

// Schema for updating an existing location (all fields optional)
export const locationUpdateSchema = locationSchema.partial();

// Schema for geocoding request
export const geocodeRequestSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().optional(),
});

// Response types
export const locationResponseSchema = locationSchema.extend({
  id: z.string(),
  slug: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  _count: z
    .object({
      courses: z.number(),
    })
    .optional(),
});

export const locationListResponseSchema = z.object({
  locations: z.array(locationResponseSchema),
  total: z.number(),
});

export const geocodeResponseSchema = z.object({
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  success: z.boolean(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
  referencingCourses: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
      })
    )
    .optional(),
});

// TypeScript types derived from schemas
export type LocationInput = z.infer<typeof locationSchema>;
export type LocationCreateInput = z.infer<typeof locationCreateSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type LocationResponse = z.infer<typeof locationResponseSchema>;
export type LocationListResponse = z.infer<typeof locationListResponseSchema>;
export type GeocodeRequest = z.infer<typeof geocodeRequestSchema>;
export type GeocodeResponse = z.infer<typeof geocodeResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
