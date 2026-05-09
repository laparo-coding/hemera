interface CourseUrlInput {
  id: string;
  slug?: string | null;
}

export function getAdminCourseEditUrl(courseId: string): string {
  return `/admin/courses/${courseId}/edit`;
}

export function getCourseUrl(course: CourseUrlInput): string {
  const slug = course.slug?.trim();
  const slugOrId = slug ? encodeURIComponent(slug) : course.id;

  return `/courses/${slugOrId}`;
}
