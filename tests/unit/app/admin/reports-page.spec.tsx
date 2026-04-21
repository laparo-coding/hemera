/** @jest-environment jsdom */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('@/components/admin/AdminPageContainer', () => ({
  AdminPageContainer: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid='admin-page-container'>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

import ReportsPage from '@/app/admin/reports/page';

const mockFetch = jest.fn();

const reportsPayload = {
  data: {
    stats: {
      totalUsers: 0,
      newUsersLast30Days: 0,
      totalCourses: 4,
      publishedCourses: 3,
      totalBookings: 6,
    },
    bookings: {
      total: 6,
      byStatus: { CONFIRMED: 1, PENDING: 2 },
      last7Days: 4,
      last30Days: 4,
      revenue: { total: 84700, last30Days: 54700 },
    },
    courseUtilization: [
      {
        courseId: 'course-1',
        courseTitle: 'Grundlagen',
        maxParticipants: 25,
        currentBookings: 3,
        utilizationPercent: 12,
      },
    ],
    userGrowth: {
      total: 0,
      outperformers: 0,
      admins: 0,
      monthlyGrowth: [],
    },
  },
};

const healthPayload = {
  data: {
    overall: 'degraded',
    services: {
      database: {
        name: 'database',
        nameDe: 'Datenbank',
        status: 'healthy',
        lastChecked: '2026-04-19T19:03:45.728Z',
      },
      clerk: {
        name: 'clerk',
        nameDe: 'Authentifizierung',
        status: 'degraded',
        message: 'E2E-/Mock-Modus aktiv',
        lastChecked: '2026-04-19T19:03:45.449Z',
      },
      stripe: {
        name: 'stripe',
        nameDe: 'Zahlungen',
        status: 'healthy',
        lastChecked: '2026-04-19T19:03:45.439Z',
      },
      rollbar: {
        name: 'rollbar',
        nameDe: 'Fehlerüberwachung',
        status: 'healthy',
        lastChecked: '2026-04-19T19:03:45.440Z',
      },
    },
    build: {
      version: '0.1.2',
      commitSha: '7579eaf6efe9b671f925219a97d6840335836278',
      buildTime: '2026-04-19T19:03:45.439Z',
      environment: 'preview',
    },
    lastChecked: '2026-04-19T19:03:45.439Z',
  },
};

describe('Admin Reports Page', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders the Rollbar health chip from the health endpoint', async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/admin/reports/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => reportsPayload,
        });
      }

      if (url.includes('/api/admin/reports/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => healthPayload,
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(
        screen.getByTestId('health-status-rollbar')
      ).toHaveTextContent('Fehlerüberwachung: Gesund');
    });

    expect(screen.getByText('Gesamtstatus:')).toBeInTheDocument();
    expect(screen.getByText('Dienste:')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Berichte & Analysen' })
    ).toBeInTheDocument();
  });
});