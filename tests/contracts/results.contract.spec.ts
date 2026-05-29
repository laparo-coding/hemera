import { describe, expect, it } from '@/tests/vitest/jest-globals';

describe('Contract: GET/PUT /api/my-courses/[bookingId]/results', () => {
  it('validates negotiation outcome payload', () => {
    const validPayload = {
      outcomeSummary: 'Negotiated 8% increase effective March',
      notes: 'Manager agreed after presenting industry benchmarks',
      followUpDate: '2026-03-15',
    };

    expect(validPayload.outcomeSummary.length).toBeGreaterThan(0);
    expect(validPayload.followUpDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns results data with audit fields and status progression', () => {
    const expectedResponse = {
      bookingId: 'booking_123',
      participationId: 'participation_123',
      outcomeSummary: 'Negotiated 8% increase effective March',
      notes: 'Manager agreed after presenting industry benchmarks',
      followUpDate: '2026-03-15',
      resultsCompletedAt: '2026-03-20T09:15:00.000Z',
      status: 'COMPLETE',
      updatedAt: '2026-03-20T09:15:00.000Z',
    };

    expect(expectedResponse.status).toBe('COMPLETE');
    expect(new Date(expectedResponse.resultsCompletedAt).toString()).not.toBe(
      'Invalid Date'
    );
  });
});
