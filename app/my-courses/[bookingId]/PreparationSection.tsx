/**
 * Preparation Section Client Component
 *
 * Displays the course participation stepper for upcoming courses.
 * Handles starting participation and guiding through preparation steps.
 */

'use client';

import { PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import { useState, useTransition } from 'react';
import { colors } from '@/lib/design-tokens';
import {
  CourseParticipationStepper,
  ResumeUploader,
  SummaryAssetList,
} from '../../../components/participation';
import type { ParticipationSummary } from '../../../lib/actions/participation';
import { startParticipationAction } from '../../../lib/actions/participation';
import type { PreparationInput } from '../../../lib/db/courseParticipation';

interface PreparationSectionProps {
  bookingId: string;
  hasParticipation: boolean;
}

export default function PreparationSection({
  bookingId,
  hasParticipation: initialHasParticipation,
}: PreparationSectionProps) {
  const [hasParticipation, setHasParticipation] = useState(
    initialHasParticipation
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Start participation when user clicks the button
  const handleStartPreparation = async () => {
    setLoading(true);
    setError(null);
    startTransition(async () => {
      try {
        const result = await startParticipationAction(bookingId);
        if (result.success && result.data) {
          setHasParticipation(true);
        } else {
          setError(
            result.error?.message || 'Fehler beim Starten der Vorbereitung'
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    });
  };

  // If no participation yet, show start button
  if (!hasParticipation) {
    return (
      <Paper
        id='vorbereitung'
        elevation={0}
        data-testid='vorbereitung-section'
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: '16px',
          border: '1px solid rgba(22, 64, 77, 0.1)',
          bgcolor: colors.white,
          scrollMarginTop: '80px',
        }}
      >
        <Typography
          component='h2'
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: colors.marsala,
            mb: 2,
          }}
        >
          Vorbereitung
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            color: colors.lightBlack,
            opacity: 0.8,
            mb: 3,
          }}
        >
          Starte jetzt deine Vorbereitung, um das Beste aus deinem Seminar
          herauszuholen.
        </Typography>

        <Button
          variant='contained'
          startIcon={
            isPending || loading ? (
              <CircularProgress size={16} color='inherit' />
            ) : (
              <PlayArrowIcon />
            )
          }
          disabled={isPending || loading}
          onClick={handleStartPreparation}
          sx={{
            backgroundColor: colors.bronze,
            color: colors.marsala,
            '&:hover': {
              backgroundColor: colors.marsala,
              color: colors.white,
            },
          }}
        >
          {isPending || loading ? 'Wird gestartet...' : 'Vorbereitung starten'}
        </Button>
      </Paper>
    );
  }

  // Participation exists - show the stepper
  return (
    <Paper
      id='vorbereitung'
      elevation={0}
      data-testid='vorbereitung-section'
      sx={{
        p: { xs: 3, md: 4 },
        mb: 3,
        borderRadius: '16px',
        border: '1px solid rgba(22, 64, 77, 0.1)',
        bgcolor: colors.white,
        scrollMarginTop: '80px',
      }}
    >
      <Typography
        component='h2'
        sx={{
          fontFamily: '"Playfair Display", serif',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: colors.marsala,
          mb: 2,
        }}
      >
        Vorbereitung
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <CourseParticipationStepper
        bookingId={bookingId}
        visibleStepKeys={['PREPARATION', 'SUMMARY']}
        renderPreparation={({ participation, onComplete }) => (
          <PreparationStepContent
            bookingId={participation.booking.id}
            participation={participation}
            onComplete={onComplete}
          />
        )}
        renderSummary={({ participation, onComplete }) => (
          <SummaryStepContent
            bookingId={participation.booking.id}
            onComplete={onComplete}
          />
        )}
      />
    </Paper>
  );
}

// Preparation step with text fields and résumé uploader
interface PreparationStepContentProps {
  bookingId: string;
  participation: ParticipationSummary['participation'];
  onComplete: (data: PreparationInput) => Promise<void>;
}

const PreparationStepContent: React.FC<PreparationStepContentProps> = ({
  bookingId,
  participation,
  onComplete,
}) => {
  const [_resumeUploaded, setResumeUploaded] = useState(false);
  const [preparationIntent, setPreparationIntent] = useState(
    participation.preparationIntent || ''
  );
  const [desiredResults, setDesiredResults] = useState(
    participation.desiredResults || ''
  );
  const [lineManagerProfile, setLineManagerProfile] = useState(
    participation.lineManagerProfile || ''
  );
  const [submitting, setSubmitting] = useState(false);

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await onComplete({
        preparationIntent: preparationIntent || undefined,
        desiredResults: desiredResults || undefined,
        lineManagerProfile: lineManagerProfile || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant='body2' sx={{ mb: 3, color: colors.lightBlack }}>
        Bereite dich auf das Seminar vor, indem du deine Ziele definierst.
      </Typography>

      {/* Preparation Intent */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant='subtitle2'
          sx={{ mb: 1, color: colors.marsala, fontWeight: 500 }}
        >
          Was ist deine Absicht für dieses Seminar?
        </Typography>
        <textarea
          value={preparationIntent}
          onChange={e => setPreparationIntent(e.target.value)}
          placeholder='Beschreibe, was du mit diesem Seminar erreichen möchtest...'
          style={{
            width: '100%',
            minHeight: '240px',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            outline: 'none',
            backgroundColor: colors.lightGray,
            color: colors.lightBlack,
            fontFamily: 'inherit',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </Box>

      {/* Desired Results */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant='subtitle2'
          sx={{ mb: 1, color: colors.marsala, fontWeight: 500 }}
        >
          Welche Ergebnisse erwartest du nach dem Seminar?
        </Typography>
        <textarea
          value={desiredResults}
          onChange={e => setDesiredResults(e.target.value)}
          placeholder='Welche konkreten Ergebnisse möchtest du erreichen...'
          style={{
            width: '100%',
            minHeight: '240px',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            outline: 'none',
            backgroundColor: colors.lightGray,
            color: colors.lightBlack,
            fontFamily: 'inherit',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </Box>

      {/* Line Manager Profile */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant='subtitle2'
          sx={{ mb: 1, color: colors.marsala, fontWeight: 500 }}
        >
          Beschreibe deinen Vorgesetzten
        </Typography>
        <textarea
          value={lineManagerProfile}
          onChange={e => setLineManagerProfile(e.target.value)}
          placeholder='Charaktereigenschaften, Kommunikationsstil, Prioritäten deines Vorgesetzten...'
          style={{
            width: '100%',
            minHeight: '240px',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            outline: 'none',
            backgroundColor: colors.lightGray,
            color: colors.lightBlack,
            fontFamily: 'inherit',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </Box>

      {/* Resume Upload */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant='subtitle2'
          sx={{ mb: 1, color: colors.marsala, fontWeight: 500 }}
        >
          Lebenslauf (optional)
        </Typography>
        <ResumeUploader
          bookingId={bookingId}
          onUploadComplete={() => setResumeUploaded(true)}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <button
          type='button'
          onClick={handleComplete}
          disabled={submitting}
          style={{
            backgroundColor: submitting ? colors.rosyBrown : colors.marsala,
            color: colors.white,
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          {submitting ? 'Wird gespeichert...' : 'Vorbereitung abschließen'}
        </button>
      </Box>
    </Box>
  );
};

// Summary step with video list
interface SummaryStepContentProps {
  bookingId: string;
  onComplete: () => Promise<void>;
}

const SummaryStepContent: React.FC<SummaryStepContentProps> = ({
  bookingId,
  onComplete,
}) => {
  const [allViewed, setAllViewed] = useState(false);

  return (
    <Box sx={{ mt: 2 }}>
      <SummaryAssetList
        bookingId={bookingId}
        onAllAssetsViewed={() => setAllViewed(true)}
      />

      <Box sx={{ mt: 3 }}>
        <button
          type='button'
          onClick={onComplete}
          disabled={!allViewed}
          style={{
            backgroundColor: allViewed ? colors.marsala : colors.rosyBrown,
            color: colors.white,
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: allViewed ? 'pointer' : 'not-allowed',
            fontWeight: 500,
          }}
        >
          {allViewed ? 'Weiter zur Nachbereitung' : 'Bitte alle Videos ansehen'}
        </button>
      </Box>
    </Box>
  );
};
