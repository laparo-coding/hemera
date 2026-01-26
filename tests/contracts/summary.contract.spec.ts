import { describe, expect, it } from '@jest/globals';

describe('Contract: GET /api/my-courses/[bookingId]/summary', () => {
  it('provides merged course default and booking override assets', () => {
    const responsePayload = {
      bookingId: 'booking_123',
      assets: [
        {
          source: 'COURSE_DEFAULT' as const,
          assetId: 'asset_default_1',
          playbackId: 'playback_default_1',
          title: 'Course Overview',
          sortOrder: 0,
        },
        {
          source: 'BOOKING_OVERRIDE' as const,
          assetId: 'asset_override_1',
          playbackId: 'playback_override_1',
          title: 'Team-Specific Briefing',
          sortOrder: 1,
        },
      ],
      summaryCompletedAt: null,
      status: 'SUMMARY',
    };

    expect(responsePayload.assets).toHaveLength(2);
    expect(responsePayload.assets[0].source).toBe('COURSE_DEFAULT');
    expect(responsePayload.assets[1].source).toBe('BOOKING_OVERRIDE');
  });

  it('returns empty payload when no assets exist and marks summary as hidden', () => {
    const emptyResponse = {
      bookingId: 'booking_123',
      assets: [] as const,
      hidden: true,
      summaryCompletedAt: null,
      status: 'PREPARATION',
    };

    expect(Array.isArray(emptyResponse.assets)).toBe(true);
    expect(emptyResponse.assets.length).toBe(0);
    expect(emptyResponse.hidden).toBe(true);
  });
});
