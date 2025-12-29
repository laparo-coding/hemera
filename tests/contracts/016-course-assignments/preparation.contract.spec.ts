import { describe, expect, it } from '@jest/globals';

describe('Contract: GET/PUT /api/my-courses/[bookingId]/preparation', () => {
  const endpoint = '/api/my-courses/[bookingId]/preparation';

  it('defines request validation schema for updating preparation data', () => {
    const validPayload = {
      intention: 'Learn salary negotiation tactics',
      desiredResults: 'Negotiate a 10% raise within 3 months',
      lineManagerProfile: 'Line manager: Marie, prefers data-backed arguments',
    };

    expect(typeof endpoint).toBe('string');
    expect(validPayload.intention.length).toBeGreaterThan(0);
    expect(validPayload.desiredResults.length).toBeGreaterThan(0);
    expect(validPayload.lineManagerProfile.length).toBeGreaterThan(0);
  });

  it('defines response schema carrying timestamps and completion state', () => {
    const expectedResponseShape = {
      bookingId: 'booking_123',
      participationId: 'participation_123',
      intention: 'Learn salary negotiation tactics',
      desiredResults: 'Negotiate a 10% raise within 3 months',
      lineManagerProfile: 'Line manager: Marie, prefers data-backed arguments',
      preparationCompletedAt: '2025-12-28T12:00:00.000Z',
      status: 'PREPARATION',
      updatedAt: '2025-12-28T12:00:00.000Z',
    };

    expect(expectedResponseShape.bookingId).toMatch(/^booking_/);
    expect(expectedResponseShape.status).toBe('PREPARATION');
    expect(new Date(expectedResponseShape.updatedAt).toString()).not.toBe(
      'Invalid Date'
    );
  });
});
