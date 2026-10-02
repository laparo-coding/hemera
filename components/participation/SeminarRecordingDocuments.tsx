'use client';

/**
 * Seminar Recording Documents
 * Task: T034 [US2] — Player and role-separated transcript UI for ready
 * seminar recordings. Requests fresh signed media links from Aither on each
 * load (never caches bearer URLs beyond expiry), follows MUI/Hemera design
 * tokens and WCAG 2.1 AA, and provides loading/empty/error states.
 */

import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { colors, typography } from '@/lib/design-tokens';

export interface SeminarRecordingRef {
  recordingId: string;
  recordingDate: string;
}

interface MediaAccess {
  muxPlaybackUrl: string;
  transcriptUrl: string;
  muxExpiresAt: string;
  transcriptExpiresAt: string;
}

const ACCESS_ERROR_MESSAGE = 'Zugriff auf die Seminaraufnahme fehlgeschlagen.';

interface Props {
  bookingId: string;
  recordings: SeminarRecordingRef[];
}

export default function SeminarRecordingDocuments({
  bookingId,
  recordings,
}: Props): React.ReactElement {
  const [access, setAccess] = useState<Record<string, MediaAccess>>({});
  const [transcript, setTranscript] = useState<Record<string, string>>({});
  const [recordingErrors, setRecordingErrors] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        setLoading(true);
        const nextAccess: Record<string, MediaAccess> = {};
        const nextTranscript: Record<string, string> = {};
        const nextErrors: Record<string, string> = {};
        const results = await Promise.allSettled(
          recordings.map(async recording => {
            const res = await fetch(
              '/api/service/seminar-document-access-proxy',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookingId,
                  recordingId: recording.recordingId,
                }),
              }
            );
            if (!res.ok) {
              throw new Error(ACCESS_ERROR_MESSAGE);
            }
            const payload = (await res.json()) as { data?: MediaAccess };
            const media = payload.data;
            if (!media) {
              throw new Error(ACCESS_ERROR_MESSAGE);
            }
            const transcriptRes = await fetch(media.transcriptUrl);
            if (!transcriptRes.ok) {
              throw new Error('Transkript konnte nicht geladen werden.');
            }
            return {
              media,
              transcript: await transcriptRes.text(),
            };
          })
        );

        results.forEach((result, index) => {
          const recording = recordings[index];
          if (!recording) {
            return;
          }
          const recordingId = recording.recordingId;
          if (result.status === 'fulfilled') {
            nextAccess[recordingId] = result.value.media;
            nextTranscript[recordingId] = result.value.transcript;
          } else {
            nextErrors[recordingId] =
              result.reason instanceof Error
                ? result.reason.message
                : 'Ein unerwarteter Fehler ist aufgetreten.';
          }
        });

        if (!cancelled) {
          setAccess(nextAccess);
          setTranscript(nextTranscript);
          setRecordingErrors(nextErrors);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId, recordings]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress aria-label='Seminaraufnahmen werden geladen' />
      </Box>
    );
  }

  if (recordings.length === 0) {
    return <Box aria-hidden='true' />;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        component='h2'
        sx={{
          fontFamily: typography.heading,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          fontWeight: 600,
          color: colors.marsala,
          mb: 2,
        }}
      >
        Deine Seminaraufnahme
      </Typography>

      {recordings.map(recording => {
        const media = access[recording.recordingId];
        if (!media) {
          const error = recordingErrors[recording.recordingId];
          return error ? (
            <Alert
              key={recording.recordingId}
              severity='error'
              sx={{ mb: 2, borderRadius: '8px' }}
            >
              {error}
            </Alert>
          ) : null;
        }
        return (
          <Box
            key={recording.recordingId}
            sx={{
              mb: 4,
              p: { xs: 2, sm: 3 },
              border: `1px solid ${colors.beige}`,
              borderRadius: '8px',
              backgroundColor: 'background.paper',
            }}
          >
            <Typography
              component='h3'
              sx={{
                fontFamily: typography.heading,
                fontSize: '1.125rem',
                fontWeight: 600,
                color: colors.lightBlack,
                mb: 2,
              }}
            >
              Aufnahme vom{' '}
              {new Date(recording.recordingDate).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Typography>

            {/* The full role-separated transcript is rendered directly below the
                player, serving as the accessible text alternative (WCAG 2.1 AA). */}
            {/* biome-ignore lint/a11y/useMediaCaption: transcript rendered below as text alternative */}
            <video
              controls
              preload='metadata'
              src={media.muxPlaybackUrl}
              aria-label='Seminaraufnahme Video'
              style={{
                width: '100%',
                borderRadius: '8px',
                backgroundColor: colors.lightBlack,
              }}
            >
              Dein Browser unterstützt keine Videowiedergabe.
            </video>

            <Typography
              component='h4'
              sx={{
                fontFamily: typography.heading,
                fontSize: '1rem',
                fontWeight: 600,
                color: colors.lightBlack,
                mt: 3,
                mb: 1,
              }}
            >
              Transkript
            </Typography>

            <Box
              component='pre'
              sx={{
                fontFamily: typography.body,
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                m: 0,
                p: 2,
                maxHeight: 400,
                overflowY: 'auto',
                backgroundColor: colors.beige,
                borderRadius: '8px',
                color: colors.lightBlack,
              }}
            >
              {transcript[recording.recordingId] ?? ''}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
