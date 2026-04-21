import type { Page, Route } from '@playwright/test';

const MOCK_INVOICE_PDF = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF';

const mockBookings = [
  {
    id: 'booking-next',
    courseId: 'course-next',
    courseTitle: 'Fortgeschrittene Verhandlungsstrategien',
    coursePrice: 29900,
    currency: 'EUR',
    paymentStatus: 'PAID',
    createdAt: '2026-04-01T08:00:00.000Z',
    startDate: '2099-05-20T00:00:00.000Z',
    endDate: '2099-05-20T00:00:00.000Z',
    startTime: '2099-05-20T14:00:00.000Z',
    endTime: '2099-05-20T18:00:00.000Z',
    locationName: 'Hemera Studio Wien',
    locationSlug: 'hemera-studio-wien',
    locationCity: 'Wien',
    hasParticipation: false,
    participationStatus: null,
    stripeInvoicePdfUrl: 'https://example.invalid/invoices/booking-next.pdf',
  },
  {
    id: 'booking-upcoming',
    courseId: 'course-upcoming',
    courseTitle: 'Masterclass: Exzellenz in Verhandlungen',
    coursePrice: 49900,
    currency: 'EUR',
    paymentStatus: 'PENDING',
    createdAt: '2026-04-02T08:00:00.000Z',
    startDate: '2099-06-28T00:00:00.000Z',
    endDate: '2099-06-28T00:00:00.000Z',
    startTime: '2099-06-28T10:00:00.000Z',
    endTime: '2099-06-28T16:00:00.000Z',
    locationName: 'Hemera Studio Wien',
    locationSlug: 'hemera-studio-wien',
    locationCity: 'Wien',
    hasParticipation: false,
    participationStatus: null,
    stripeInvoicePdfUrl: null,
  },
  {
    id: 'booking-completed',
    courseId: 'course-completed',
    courseTitle: 'Grundlagen der Gehaltsverhandlung',
    coursePrice: 14900,
    currency: 'EUR',
    paymentStatus: 'PAID',
    createdAt: '2026-03-01T08:00:00.000Z',
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: '2024-01-15T00:00:00.000Z',
    startTime: '2024-01-15T10:00:00.000Z',
    endTime: '2024-01-15T14:00:00.000Z',
    locationName: 'Hemera Studio Wien',
    locationSlug: 'hemera-studio-wien',
    locationCity: 'Wien',
    hasParticipation: true,
    participationStatus: 'COMPLETE',
    stripeInvoicePdfUrl: 'https://example.invalid/invoices/booking-completed.pdf',
  },
  {
    id: 'booking-no-show',
    courseId: 'course-no-show',
    courseTitle: 'Entwurfskurs fuer lokale E2E-Tests',
    coursePrice: 9900,
    currency: 'EUR',
    paymentStatus: 'PAID',
    createdAt: '2026-02-01T08:00:00.000Z',
    startDate: '2024-02-10T00:00:00.000Z',
    endDate: '2024-02-10T00:00:00.000Z',
    startTime: '2024-02-10T09:00:00.000Z',
    endTime: '2024-02-10T11:00:00.000Z',
    locationName: 'Hemera Studio Wien',
    locationSlug: 'hemera-studio-wien',
    locationCity: 'Wien',
    hasParticipation: false,
    participationStatus: null,
    stripeInvoicePdfUrl: 'https://example.invalid/invoices/booking-no-show.pdf',
  },
] as const;

function isBookingsRequest(url: string): boolean {
  return /\/api\/bookings(\?.*)?$/.test(url);
}

function isInvoiceRequest(url: string): boolean {
  return /\/api\/bookings\/[^/]+\/invoice$/.test(url);
}

async function fulfillBookings(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: {
        bookings: mockBookings,
        pagination: {
          page: 1,
          limit: 100,
          total: mockBookings.length,
          pages: 1,
        },
      },
    }),
  });
}

async function fulfillInvoice(route: Route) {
  const url = route.request().url();
  const bookingId = url.match(/\/api\/bookings\/([^/]+)\/invoice$/)?.[1] ?? 'invoice';

  await route.fulfill({
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rechnung-${bookingId}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    },
    body: MOCK_INVOICE_PDF,
  });
}

export async function mockDashboardBookings(page: Page): Promise<void> {
  await page.route(/\/api\/bookings\/[^/]+\/invoice$/, async route => {
    await fulfillInvoice(route);
  });

  await page.route(/\/api\/bookings(?:\?.*)?$/, async route => {
    await fulfillBookings(route);
  });
}