/**
 * Course Material Create Page
 * Feature: 026-course-material-integration
 *
 * Server Component that statically imports CreateCourseMaterialClient (a Client Component)
 * per coding guidelines. This component acts as a route boundary for the /new page.
 */

import CreateCourseMaterialClient from './create-client';

export default function NewCourseMaterialPage() {
  return <CreateCourseMaterialClient />;
}
