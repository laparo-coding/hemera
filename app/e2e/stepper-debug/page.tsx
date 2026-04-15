// Temporary debug page for stepper alignment inspection (spec 027).
// TODO(cleanup): Remove this page and its E2E tests once CourseProgressStepper
// alignment is verified stable in production. Guarded by NODE_ENV check below.

import { notFound } from 'next/navigation';
import StepperDebugClient from './StepperDebugClient';

export default function StepperDebugPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <StepperDebugClient />;
}
