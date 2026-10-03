/**
 * @vitest-environment jsdom
 */
/**
 * SeminarRecordingDocuments: contract with the seminar document access proxy.
 * The component sends only booking/recording selectors (the server derives
 * the user from the session) and reads the signed links from the
 * `{ success, data }` envelope of the proxy response.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SeminarRecordingDocuments from '@/components/participation/SeminarRecordingDocuments';

const PROXY_URL = '/api/service/seminar-document-access-proxy';
const ACCESS_ERROR = 'Zugriff auf die Seminaraufnahme fehlgeschlagen.';

const recordings = [
  { recordingId: 'recording-a', recordingDate: '2026-09-30T10:00:00.000Z' },
  { recordingId: 'recording-b', recordingDate: '2026-10-01T10:00:00.000Z' },
];

function mediaFor(recordingId: string) {
  return {
    muxPlaybackUrl: `https://stream.mux.com/${recordingId}.m3u8?token=signed`,
    transcriptUrl: `https://blob.example.com/${recordingId}.txt?sig=signed`,
    muxExpiresAt: '2026-09-30T10:05:00.000Z',
    transcriptExpiresAt: '2026-09-30T10:05:00.000Z',
  };
}

function envelope(recordingId: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data: mediaFor(recordingId),
      meta: { requestId: 'request-1' },
    })
  );
}

function stubFetch(proxy: (recordingId: string) => Response) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === PROXY_URL) {
      const { recordingId } = JSON.parse(String(init?.body)) as {
        recordingId: string;
      };
      return Promise.resolve(proxy(recordingId));
    }
    const match = /\/(recording-[a-z])\.txt/.exec(url);
    if (match) {
      return Promise.resolve(new Response(`Transkript ${match[1]}`));
    }
    return Promise.resolve(new Response('unexpected', { status: 500 }));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('SeminarRecordingDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('sends only booking and recording selectors and renders the unwrapped links', async () => {
    const fetchMock = stubFetch(envelope);

    render(
      <SeminarRecordingDocuments bookingId='booking-a' recordings={recordings} />
    );

    expect(await screen.findByText('Transkript recording-a')).toBeTruthy();
    expect(screen.getByText('Transkript recording-b')).toBeTruthy();

    const proxyCalls = fetchMock.mock.calls.filter(
      ([input]) => String(input) === PROXY_URL
    );
    expect(proxyCalls).toHaveLength(recordings.length);
    for (const [, init] of proxyCalls) {
      expect(init?.method).toBe('POST');
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(Object.keys(body).sort()).toEqual(['bookingId', 'recordingId']);
      expect(body.bookingId).toBe('booking-a');
    }

    const players = screen.getAllByLabelText('Seminaraufnahme Video');
    expect(players.map(player => player.getAttribute('src'))).toEqual(
      recordings.map(({ recordingId }) => mediaFor(recordingId).muxPlaybackUrl)
    );
  });

  it('rejects a flat payload without the data envelope', async () => {
    stubFetch(
      recordingId => new Response(JSON.stringify(mediaFor(recordingId)))
    );

    render(
      <SeminarRecordingDocuments
        bookingId='booking-a'
        recordings={recordings.slice(0, 1)}
      />
    );

    expect(await screen.findByText(ACCESS_ERROR)).toBeTruthy();
    expect(screen.queryByLabelText('Seminaraufnahme Video')).toBeNull();
  });

  it('shows an error for a denied recording while keeping the others visible', async () => {
    stubFetch(recordingId =>
      recordingId === 'recording-a'
        ? new Response(JSON.stringify({ success: false }), { status: 404 })
        : envelope(recordingId)
    );

    render(
      <SeminarRecordingDocuments bookingId='booking-a' recordings={recordings} />
    );

    expect(await screen.findByText(ACCESS_ERROR)).toBeTruthy();
    expect(screen.getByText('Transkript recording-b')).toBeTruthy();
    expect(screen.queryByText('Transkript recording-a')).toBeNull();
  });
});
