/**
 * Course Detail Loading State
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Shows skeleton while course data is loading to prevent CLS.
 */

import { CourseDetailSkeleton } from '../../../components/course-detail';

export default function CourseDetailLoading() {
  return <CourseDetailSkeleton />;
}
