export type WorkstreamPriority = 'high' | 'medium' | 'low';
export type WorkstreamFocusArea =
  | 'backend-logic'
  | 'api-behavior'
  | 'dashboard-journey'
  | 'shared-infra';

export interface TestWorkstream {
  id: string;
  name: string;
  priority: WorkstreamPriority;
  focusArea: WorkstreamFocusArea;
  testLayers: string[];
  candidatePaths: string[];
  successSignal: string;
}

export const testWorkstreams: TestWorkstream[] = [
  {
    id: 'backend-logic',
    name: 'Backend service hardening',
    priority: 'high',
    focusArea: 'backend-logic',
    testLayers: ['unit', 'integration'],
    candidatePaths: [
      'lib/services/booking.ts',
      'lib/services/prerequisite.ts',
    ],
    successSignal:
      'deterministic booking and prerequisite edge cases are covered in unit and integration runs',
  },
  {
    id: 'api-behavior',
    name: 'Bookings and admin review API coverage',
    priority: 'high',
    focusArea: 'api-behavior',
    testLayers: ['contract', 'integration'],
    candidatePaths: [
      'app/api/bookings/route.ts',
      'app/api/bookings/[bookingId]/invoice/route.ts',
      'app/api/admin/bookings/pending/route.ts',
    ],
    successSignal:
      'contracts pass and critical API paths validate booking status transitions',
  },
  {
    id: 'dashboard-journey',
    name: 'Authenticated dashboard journey coverage',
    priority: 'high',
    focusArea: 'dashboard-journey',
    testLayers: ['component', 'e2e'],
    candidatePaths: [
      'app/dashboard/page.tsx',
      'app/my-courses/page.tsx',
      'components/dashboard/UserPageContainer.tsx',
      'components/dashboard/UserBreadcrumb.tsx',
    ],
    successSignal:
      'authenticated journey flows render and navigate without regression',
  },
];
