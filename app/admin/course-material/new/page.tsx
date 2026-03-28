/**
 * Course Material Create Page
 * Feature: 026-course-material-integration
 *
 * Server component that renders the client-side create form.
 */

import dynamic from 'next/dynamic';

const CreateCourseMaterialClient = dynamic(
  () => import('./create-client'),
  {
    ssr: false,
    loading: () => <div>Lade deinen Editor ...</div>,
  },
);

export default function NewCourseMaterialPage() {
  return <CreateCourseMaterialClient />;
}
