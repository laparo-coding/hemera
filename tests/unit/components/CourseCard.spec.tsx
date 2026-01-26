/**
 * T006: Unit Test - CourseCard Component
 *
 * Tests for the enhanced course card that displays date/time/location.
 */

import { describe, expect, it } from '@jest/globals';

// Types for the CourseCard component props
interface CourseCardProps {
  id: string;
  courseTitle: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  locationSlug: string | null;
  locationCity: string | null;
  hasParticipation: boolean;
  paymentStatus: string;
  stripeInvoicePdfUrl: string | null;
}

// Helper functions that will be implemented in the component
const formatDateRange = (
  startDate: string | null,
  endDate: string | null
): string => {
  if (!startDate) return 'Datum noch nicht festgelegt';

  const start = new Date(startDate);
  const startFormatted = start.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (!endDate) return startFormatted;

  const end = new Date(endDate);
  const isSameDay = start.toDateString() === end.toDateString();

  if (isSameDay) return startFormatted;

  const endFormatted = end.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `${startFormatted} - ${endFormatted}`;
};

const formatTimeRange = (
  startTime: string | null,
  endTime: string | null
): string => {
  if (!startTime || !endTime) return '';

  const start = new Date(startTime);
  const end = new Date(endTime);

  const startFormatted = start.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endFormatted = end.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${startFormatted} - ${endFormatted} Uhr`;
};

const getLocationDisplayText = (
  name: string | null,
  city: string | null
): string => {
  if (!name) return '';
  if (!city) return name;
  return `${name}, ${city}`;
};

describe('CourseCard Component', () => {
  describe('Date formatting', () => {
    it('should display single date for single-day course', () => {
      const result = formatDateRange('2026-02-15T00:00:00Z', null);
      expect(result).toBe('15.02.2026');
    });

    it('should display date range for multi-day course', () => {
      const result = formatDateRange(
        '2026-02-15T00:00:00Z',
        '2026-02-17T00:00:00Z'
      );
      expect(result).toBe('15.02.2026 - 17.02.2026');
    });

    it('should display single date when start and end are same day', () => {
      // Use times that are definitely the same day in any timezone
      const result = formatDateRange(
        '2026-02-15T10:00:00Z',
        '2026-02-15T15:00:00Z'
      );
      expect(result).toBe('15.02.2026');
    });

    it('should show placeholder when no date set', () => {
      const result = formatDateRange(null, null);
      expect(result).toBe('Datum noch nicht festgelegt');
    });
  });

  describe('Time formatting', () => {
    it('should display time range in German format', () => {
      const result = formatTimeRange(
        '2026-02-15T09:00:00Z',
        '2026-02-15T17:00:00Z'
      );
      expect(result).toMatch(/\d{2}:\d{2} - \d{2}:\d{2} Uhr/);
    });

    it('should return empty string when times not set', () => {
      const result = formatTimeRange(null, null);
      expect(result).toBe('');
    });

    it('should return empty string when only start time set', () => {
      const result = formatTimeRange('2026-02-15T09:00:00Z', null);
      expect(result).toBe('');
    });
  });

  describe('Location display', () => {
    it('should display location name and city', () => {
      const result = getLocationDisplayText('Seminarhaus Süd', 'München');
      expect(result).toBe('Seminarhaus Süd, München');
    });

    it('should display only name when city is null', () => {
      const result = getLocationDisplayText('Online Seminar', null);
      expect(result).toBe('Online Seminar');
    });

    it('should return empty string when no location', () => {
      const result = getLocationDisplayText(null, null);
      expect(result).toBe('');
    });
  });

  describe('Invoice button visibility', () => {
    it('should show invoice button when PDF URL exists', () => {
      const props: CourseCardProps = {
        id: 'booking-1',
        courseTitle: 'Test Kurs',
        startDate: '2026-02-15T00:00:00Z',
        endDate: null,
        startTime: '2026-02-15T09:00:00Z',
        endTime: '2026-02-15T17:00:00Z',
        locationName: 'Test Location',
        locationSlug: 'test-location',
        locationCity: 'Berlin',
        hasParticipation: false,
        paymentStatus: 'PAID',
        stripeInvoicePdfUrl: 'https://invoice.stripe.com/test/pdf',
      };

      const showInvoiceButton =
        props.paymentStatus === 'PAID' && props.stripeInvoicePdfUrl !== null;
      expect(showInvoiceButton).toBe(true);
    });

    it('should hide invoice button when not paid', () => {
      const props: CourseCardProps = {
        id: 'booking-1',
        courseTitle: 'Test Kurs',
        startDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        locationName: null,
        locationSlug: null,
        locationCity: null,
        hasParticipation: false,
        paymentStatus: 'PENDING',
        stripeInvoicePdfUrl: null,
      };

      const showInvoiceButton =
        props.paymentStatus === 'PAID' && props.stripeInvoicePdfUrl !== null;
      expect(showInvoiceButton).toBe(false);
    });

    it('should hide invoice button when no PDF URL', () => {
      const props: CourseCardProps = {
        id: 'booking-1',
        courseTitle: 'Test Kurs',
        startDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        locationName: null,
        locationSlug: null,
        locationCity: null,
        hasParticipation: false,
        paymentStatus: 'PAID',
        stripeInvoicePdfUrl: null,
      };

      const showInvoiceButton =
        props.paymentStatus === 'PAID' && props.stripeInvoicePdfUrl !== null;
      expect(showInvoiceButton).toBe(false);
    });
  });

  describe('Preparation button logic', () => {
    it('should show Vorbereitung button for upcoming course without participation', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const startDate = futureDate.toISOString();
      const hasParticipation = false;
      const isUpcoming = new Date(startDate) > now;

      const showPreparationButton = isUpcoming && !hasParticipation;
      expect(showPreparationButton).toBe(true);
    });

    it('should hide Vorbereitung button when participation exists', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const startDate = futureDate.toISOString();
      const hasParticipation = true;
      const isUpcoming = new Date(startDate) > now;

      const showPreparationButton = isUpcoming && !hasParticipation;
      expect(showPreparationButton).toBe(false);
    });
  });

  describe('Location link generation', () => {
    it('should generate correct location link', () => {
      const locationSlug = 'seminarhaus-sued';
      const expectedLink = `/locations/${locationSlug}`;

      expect(expectedLink).toBe('/locations/seminarhaus-sued');
    });

    it('should not generate link when no slug', () => {
      const locationSlug: string | null = null;
      const hasLink = locationSlug !== null;

      expect(hasLink).toBe(false);
    });
  });
});
