export interface CourseUrlInput {
  id: string;
  slug?: string | null;
}

export function getAdminCourseEditUrl(courseId: string): string {
  return `/admin/courses/${encodeURIComponent(courseId)}/edit`;
}

export function getCourseUrl(course: CourseUrlInput): string {
  const slug = course.slug?.trim();
  const courseId = course.id.trim();

  if (!slug && courseId.length === 0) {
    throw new Error('Course id is required when slug is missing');
  }

  const slugOrId = slug
    ? encodeURIComponent(slug)
    : encodeURIComponent(courseId);

  return `/courses/${slugOrId}`;
}
