// Mock implementation for getCourses service
// This provides a working interface for the courses API

import type { Booking } from "@prisma/client";

export interface CourseWithBookings {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number;
  currency: string;
  capacity: number | null;
  date: Date | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  bookings: Booking[];
}

export async function getCourses(): Promise<CourseWithBookings[]> {
  // Mock data for build testing - using exact Prisma schema structure
  return [
    {
      id: "course-1",
      title: "TypeScript Grundlagen",
      description: "Lernen Sie die Grundlagen von TypeScript",
      slug: "typescript-grundlagen",
      price: 9999, // €99.99 in cents
      currency: "EUR",
      capacity: 20,
      date: new Date("2025-12-01"),
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      bookings: [],
    },
    {
      id: "course-2",
      title: "React Advanced Patterns",
      description: "Fortgeschrittene React Konzepte und Patterns",
      slug: "react-advanced-patterns",
      price: 14999, // €149.99 in cents
      currency: "EUR",
      capacity: 15,
      date: new Date("2025-12-15"),
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      bookings: [],
    },
    {
      id: "course-3",
      title: "Node.js Backend Development",
      description: "Erstellen Sie skalierbare Backend-Anwendungen",
      slug: "nodejs-backend",
      price: 19999, // €199.99 in cents
      currency: "EUR",
      capacity: 25,
      date: new Date("2026-01-10"),
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      bookings: [],
    },
  ];
}
