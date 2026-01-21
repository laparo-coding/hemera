/**
 * CourseTestimonialsLoader Component
 *
 * Feature: 017-testimonial-management
 * Client-side loader that fetches public course testimonials
 * when they are not already provided via server props.
 */

'use client';

import { useEffect, useState } from 'react';
import type { Testimonial } from './TestimonialsSection';
import { TestimonialsSection } from './TestimonialsSection';

interface CourseTestimonialsLoaderProps {
  courseIdOrSlug: string;
}

type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

type ApiErrorResponse = {
  success: false;
  error: string;
  code?: string;
};

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function CourseTestimonialsLoader({
  courseIdOrSlug,
}: CourseTestimonialsLoaderProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null);
  const [hasTried, setHasTried] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTestimonials() {
      try {
        const res = await fetch(
          `/api/courses/${encodeURIComponent(courseIdOrSlug)}/testimonials?limit=6`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!isMounted) return;

        if (!res.ok) {
          setHasTried(true);
          return;
        }

        const json = (await res.json()) as ApiResponse<Testimonial[]>;

        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setTestimonials(json.data);
        }

        setHasTried(true);
      } catch {
        if (!isMounted) return;
        setHasTried(true);
      }
    }

    // Nur laden, wenn wir noch keinen Versuch gemacht haben
    if (!hasTried && courseIdOrSlug) {
      void loadTestimonials();
    }

    return () => {
      isMounted = false;
    };
  }, [courseIdOrSlug, hasTried]);

  // Kein Loader-Skelett: Abschnitt bleibt einfach unsichtbar,
  // bis Testimonials vorhanden sind.
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return <TestimonialsSection testimonials={testimonials} />;
}

export default CourseTestimonialsLoader;
