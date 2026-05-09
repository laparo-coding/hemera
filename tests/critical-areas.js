export const criticalAreas = [
  {
    id: 'backend-logic',
    name: 'Booking and prerequisite services',
    category: 'backend-logic',
    paths: ['lib/services/booking.ts', 'lib/services/prerequisite.ts'],
    rationale:
      'High-value booking rules currently miss function and line coverage.',
    primaryTestLayers: ['unit', 'integration'],
  },
  {
    id: 'api-behavior',
    name: 'Bookings and admin review APIs',
    category: 'api-behavior',
    paths: [
      'app/api/bookings/route.ts',
      'app/api/bookings/[bookingId]/invoice/route.ts',
      'app/api/admin/bookings/pending/route.ts',
    ],
    rationale:
      'Critical booking and review APIs need contract coverage and clear gate ownership.',
    primaryTestLayers: ['contract', 'integration'],
  },
  {
    id: 'dashboard-journey',
    name: 'Authenticated dashboard journeys',
    category: 'dashboard-journey',
    paths: [
      'app/dashboard/page.tsx',
      'app/my-courses/page.tsx',
      'app/user-profile/[[...user-profile]]/page.tsx',
      'components/dashboard/UserPageContainer.tsx',
      'components/dashboard/UserBreadcrumb.tsx',
    ],
    rationale:
      'High-value user journeys need stable authenticated coverage beyond smoke checks.',
    primaryTestLayers: ['component', 'e2e'],
  },
];
