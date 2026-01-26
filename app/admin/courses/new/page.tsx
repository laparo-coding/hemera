/**
 * Create Course Page (Server Component)
 *
 * Page for creating a new course.
 * Note: Admin authentication is handled by the parent layout.
 */

import type { Metadata } from 'next';
import { listLocations } from '@/lib/services/location';
import NewCourseForm from './NewCourseForm';

export const metadata: Metadata = {
  title: 'Neues Seminar erstellen | Admin',
  description: 'Neues Seminar erstellen',
};

// Prevent static generation - this page needs DB access at runtime
export const dynamic = 'force-dynamic';

export default async function NewCoursePage() {
  const { locations } = await listLocations();

  // Map to simple format for dropdown
  const locationOptions = locations.map(loc => ({
    id: loc.id,
    name: loc.name,
    city: loc.city,
  }));

  return <NewCourseForm locations={locationOptions} />;
}
