/**
 * CourseDetailLayout Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Orchestrates all course detail sections into a cohesive layout.
 */

import { Box } from '@mui/material';
import type React from 'react';
import { colors } from '../../lib/design-tokens';
import { BookingCTA } from './BookingCTA';
import { CourseHeroSection } from './CourseHeroSection';
import { CourseOverviewSection } from './CourseOverviewSection';
import type { CurriculumModule } from './CurriculumSection';
import { CurriculumSection } from './CurriculumSection';
import { DatesPricingSection } from './DatesPricingSection';
import type { Testimonial } from './TestimonialsSection';
import { TestimonialsSection } from './TestimonialsSection';

export interface CourseDetailCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tagline?: string;
  heroVideoPlaybackId: string | null;
  thumbnailUrl?: string | null;
  instructor: string | null;
  price: number;
  currency: string;
  startDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  location: {
    name: string;
    city: string;
  } | null;
  learningObjectives?: string[];
  curriculumModules?: CurriculumModule[];
  testimonials?: Testimonial[];
}

export interface CourseDetailLayoutProps {
  course: CourseDetailCourse;
}

export const CourseDetailLayout: React.FC<CourseDetailLayoutProps> = ({
  course,
}) => {
  const courseSlug = course.slug || course.id;

  return (
    <Box
      component='main'
      sx={{
        width: '100%',
        backgroundColor: colors.cream,
      }}
    >
      {/* 1. Hero Section - Full-width with video (only if available) */}
      <CourseHeroSection
        title={course.title}
        level={course.level}
        tagline={course.tagline}
        heroVideoPlaybackId={course.heroVideoPlaybackId}
        courseId={course.id}
        courseSlug={courseSlug}
      />

      {/* 2. Overview Section - Description, objectives, instructor */}
      <CourseOverviewSection
        title={course.title}
        description={course.description || 'Keine Beschreibung verfügbar.'}
        learningObjectives={course.learningObjectives || []}
        instructor={course.instructor || 'Hemera Academy Team'}
        courseId={course.id}
        courseSlug={courseSlug}
      />

      {/* 3. Curriculum Section - Accordion with day modules */}
      <CurriculumSection modules={course.curriculumModules || []} />

      {/* 4. Dates & Pricing Section */}
      <DatesPricingSection
        price={course.price}
        currency={course.currency || 'EUR'}
        startDate={course.startDate}
        startTime={course.startTime}
        endTime={course.endTime}
        location={course.location}
        courseId={course.id}
        courseSlug={courseSlug}
      />

      {/* 5. Testimonials Section - Dark background */}
      <TestimonialsSection testimonials={course.testimonials || []} />

      {/* 6. Final CTA Banner - Full-width gold */}
      <BookingCTA
        courseId={course.id}
        courseSlug={courseSlug}
        variant='banner'
        price={course.price}
        currency={course.currency}
      />
    </Box>
  );
};

export default CourseDetailLayout;
