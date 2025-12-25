// Mock implementation for getCourses service
// This provides a working interface for the courses API

import type { Booking } from '@prisma/client';

export interface CourseWithBookings {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number;
  currency: string;
  capacity: number | null;
  startDate?: Date | null;
  startTime?: Date | null;
  endTime?: Date | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string | null;
  instructor?: string | null;
  bookings: Booking[];
}

export async function getCourses(): Promise<CourseWithBookings[]> {
  // Mock data for build testing - using exact Prisma schema structure
  return [
    {
      id: 'course-1',
      title: 'TypeScript Grundlagen',
      description: 'Lernen Sie die Grundlagen von TypeScript',
      slug: 'typescript-grundlagen',
      price: 9999, // €99.99 in cents
      currency: 'EUR',
      capacity: 20,
      startDate: new Date('2025-12-01'),
      startTime: new Date('2025-12-01T10:00:00Z'),
      endTime: new Date('2025-12-01T14:00:00Z'),
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      bookings: [],
    },
    {
      id: 'course-2',
      title: 'React Advanced Patterns',
      description: 'Fortgeschrittene React Konzepte und Patterns',
      slug: 'react-advanced-patterns',
      price: 14999, // €149.99 in cents
      currency: 'EUR',
      capacity: 15,
      startDate: new Date('2025-12-15'),
      startTime: new Date('2025-12-15T14:00:00Z'),
      endTime: new Date('2025-12-15T18:00:00Z'),
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      bookings: [],
    },
    {
      id: 'course-3',
      title: 'Node.js Backend Development',
      description: 'Erstellen Sie skalierbare Backend-Anwendungen',
      slug: 'nodejs-backend',
      price: 19999, // €199.99 in cents
      currency: 'EUR',
      capacity: 25,
      startDate: new Date('2026-01-10'),
      startTime: new Date('2026-01-10T09:00:00Z'),
      endTime: new Date('2026-01-10T17:00:00Z'),
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      bookings: [],
    },
  ];
}
