/**
 * T010: Unit Test - Booking Categorization Logic
 *
 * Tests for categorizing bookings into the 4 dashboard sections:
 * - Nächstes Seminar
 * - Weitere gebuchte Seminare
 * - Absolvierte Seminare
 * - Seminare ohne Teilnahme
 */

import { describe, expect, it } from '@jest/globals';
import {
  type BookingForCategorization,
  categorizeBookings,
} from '../../../lib/utils/booking-categorization';

describe('Booking Categorization', () => {
  const now = new Date('2026-01-24T12:00:00Z');

  // Helper to create test bookings
  const createBooking = (
    id: string,
    startDate: string | null,
    endDate: string | null = null,
    hasParticipation: boolean = false,
    paymentStatus: BookingForCategorization['paymentStatus'] = 'PAID'
  ): BookingForCategorization => ({
    id,
    paymentStatus,
    course: {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    participation: hasParticipation ? { id: `part-${id}` } : null,
  });

  describe('Section A: Nächstes Seminar', () => {
    it('should identify next upcoming seminar', () => {
      const bookings = [
        createBooking('b1', '2026-02-15'), // Future
        createBooking('b2', '2026-03-01'), // Future, later
        createBooking('b3', '2026-01-10', null, true), // Past
      ];

      const result = categorizeBookings(bookings, now);

      expect(result.nextSeminar).not.toBeNull();
      expect(result.nextSeminar?.id).toBe('b1');
    });

    it('should return null when no upcoming seminars', () => {
      const bookings = [
        createBooking('b1', '2026-01-10', null, true), // Past
        createBooking('b2', '2026-01-15', null, false), // Past
      ];

      const result = categorizeBookings(bookings, now);

      expect(result.nextSeminar).toBeNull();
    });

    it('should select earliest upcoming seminar', () => {
      const bookings = [
        createBooking('b1', '2026-03-15'), // Future, later
        createBooking('b2', '2026-02-01'), // Future, earlier (should be next)
        createBooking('b3', '2026-04-01'), // Future, even later
      ];

      const result = categorizeBookings(bookings, now);

      expect(result.nextSeminar?.id).toBe('b2');
    });
  });

  describe('Section B: Weitere gebuchte Seminare', () => {
    it('should include upcoming seminars except the next one', () => {
      const bookings = [
        createBooking('b1', '2026-02-01'),
        createBooking('b2', '2026-03-01'),
        createBooking('b3', '2026-04-01'),
      ];

      const result = categorizeBookings(bookings, now);

      expect(result.upcoming.length).toBe(2);
      expect(result.upcoming.map(b => b.id)).toEqual(['b2', 'b3']);
    });

    it('should be empty when only one upcoming seminar', () => {
      const bookings = [createBooking('b1', '2026-02-01')];

      const result = categorizeBookings(bookings, now);

      expect(result.upcoming.length).toBe(0);
    });

    it('should be sorted by start date ascending', () => {
      const bookings = [
        createBooking('b3', '2026-04-01'),
        createBooking('b1', '2026-02-01'),
        createBooking('b2', '2026-03-01'),
      ];

      const result = categorizeBookings(bookings, now);

      // After removing next seminar (b1), remaining should be sorted
      expect(result.upcoming[0]!.id).toBe('b2');
      expect(result.upcoming[1]!.id).toBe('b3');
    });
  });

  describe('Section C: Absolvierte Seminare', () => {
    it('should include past seminars with participation', () => {
      const bookings = [
        createBooking('b1', '2026-01-10', null, true), // Past with participation
        createBooking('b2', '2026-01-15', null, true), // Past with participation
        createBooking('b3', '2026-01-20', null, false), // Past without participation
      ];

      const result = categorizeBookings(bookings, now);

      expect(result.completed.length).toBe(2);
      expect(result.completed.map(b => b.id)).toContain('b1');
      expect(result.completed.map(b => b.id)).toContain('b2');
    });

    it('should be empty when no completed seminars', () => {
      const bookings = [
        createBooking('b1', '2026-02-01'), // Future
        createBooking('b2', '2026-01-10', null, false), // Past but no participation
      ];

      const result = categorizeBookings(bookings, now);

      expect(result.completed.length).toBe(0);
    });
  });

  describe('Section D: Seminare ohne Teilnahme', () => {
    it('should include past seminars without participation', () => {
      const bookings = [
        createBooking('b1', '2026-01-10', null, false), // Past without participation
        createBooking('b2', '2026-01-15', null, true), // Past with participation
      ];

      const result = categorizeBookings(bookings, now);

      expect(result.noShow.length).toBe(1);
      expect(result.noShow[0]!.id).toBe('b1');
    });

    it('should be empty when all past seminars have participation', () => {
      const bookings = [
        createBooking('b1', '2026-01-10', null, true),
        createBooking('b2', '2026-01-15', null, true),
      ];

      const result = categorizeBookings(bookings, now);

      expect(result.noShow.length).toBe(0);
    });
  });

  describe('Cancelled booking handling', () => {
    it('should exclude CANCELLED bookings from all sections', () => {
      const bookings = [
        createBooking('b1', '2026-02-01', null, false, 'CANCELLED'),
        createBooking('b2', '2026-01-10', null, true, 'CANCELLED'),
        createBooking('b3', '2026-03-01', null, false, 'PAID'),
      ];

      const result = categorizeBookings(bookings, now);

      expect(result.nextSeminar?.id).toBe('b3');
      expect(result.upcoming.length).toBe(0);
      expect(result.completed.length).toBe(0);
      expect(result.noShow.length).toBe(0);
    });

    it('should exclude FAILED bookings', () => {
      const bookings = [
        createBooking('b1', '2026-02-01', null, false, 'FAILED'),
        createBooking('b2', '2026-03-01', null, false, 'PAID'),
      ];

      const result = categorizeBookings(bookings, now);

      expect(result.nextSeminar?.id).toBe('b2');
    });
  });

  describe('Multi-day course handling', () => {
    it('should use endDate for determining if course is past', () => {
      const bookings = [
        // Multi-day course: started in past but ends in future
        createBooking('b1', '2026-01-23', '2026-01-25', false),
      ];

      const result = categorizeBookings(bookings, now);

      // Course end date (25th) is after now (24th), so it's upcoming
      expect(result.nextSeminar?.id).toBe('b1');
      expect(result.noShow.length).toBe(0);
    });

    it('should mark multi-day course as past when endDate is in past', () => {
      const bookings = [createBooking('b1', '2026-01-20', '2026-01-22', false)];

      const result = categorizeBookings(bookings, now);

      expect(result.nextSeminar).toBeNull();
      expect(result.noShow.length).toBe(1);
    });

    it('should fallback to startDate when no endDate', () => {
      const bookings = [
        createBooking('b1', '2026-01-20', null, false), // Past (no endDate)
      ];

      const result = categorizeBookings(bookings, now);

      expect(result.noShow.length).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty booking list', () => {
      const result = categorizeBookings([], now);

      expect(result.nextSeminar).toBeNull();
      expect(result.upcoming.length).toBe(0);
      expect(result.completed.length).toBe(0);
      expect(result.noShow.length).toBe(0);
    });

    it('should handle bookings with null dates', () => {
      const bookings = [
        createBooking('b1', null, null, false),
        createBooking('b2', '2026-02-01', null, false),
      ];

      const result = categorizeBookings(bookings, now);

      // Booking without date shouldn't appear in any section
      expect(result.nextSeminar?.id).toBe('b2');
    });

    it('should handle course starting exactly now', () => {
      const bookings = [createBooking('b1', '2026-01-24T12:00:00Z', null)];

      const result = categorizeBookings(bookings, now);

      // Course starting exactly now is considered past
      expect(result.nextSeminar).toBeNull();
    });
  });
});
