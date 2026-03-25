/**
 * Course Material Create Page
 * Feature: 026-course-material-integration
 *
 * Server component that renders the client-side create form.
 * Uses dynamic import with ssr:false per AR3 spec.
 */

import { CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';

const CreateCourseMaterialClient = dynamic(() => import('./create-client'), {
  ssr: false,
  loading: () => <CircularProgress aria-label='Lade Formular' />,
});

export default function NewCourseMaterialPage() {
  return <CreateCourseMaterialClient />;
}
