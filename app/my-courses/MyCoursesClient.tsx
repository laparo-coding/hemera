/**
 * My Courses Page Client Component
 *
 * Displays the user's booked courses with participation workflow.
 * Uses CourseParticipationStepper for guided course completion.
 *
 * Participations are created lazily when a user starts the preparation,
 * not automatically when a course is booked.
 */

'use client';

import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  SchoolOutlined,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { colors } from '@/lib/design-tokens';
import {
  CourseParticipationStepper,
  ResumeUploader,
  SummaryAssetList,
} from '../../components/participation';
import type {
  CourseEnrollment,
  ParticipationSummary,
} from '../../lib/actions/participation';
import {
  getMyEnrollmentsAction,
  startParticipationAction,
} from '../../lib/actions/participation';
import type { PreparationInput } from '../../lib/db/courseParticipation';

// Status labels in German
const statusLabels: Record<string, string> = {
  PREPARATION: 'Vorbereitung',
  SUMMARY: 'Zusammenfassung',
  DEBRIEFING: 'Nachbereitung',
  RESULT: 'Ergebnis',
  COMPLETE: 'Abgeschlossen',
};

interface MyCoursesClientProps {
  userId: string;
}

export const MyCoursesClient: React.FC<MyCoursesClientProps> = ({
  userId: _userId,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load enrollments (bookings with optional participation)
  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMyEnrollmentsAction();
      if (result.success && result.data) {
        setEnrollments(result.data);
        // Auto-expand the first enrollment that has a participation in progress
        const firstActive = result.data.find(
          e => e.participation && e.participation.status !== 'COMPLETE'
        );
        if (firstActive) {
          setExpandedId(firstActive.booking.id);
        }
      } else {
        setError(result.error?.message || 'Fehler beim Laden der Kurse');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const handleAccordionChange = (bookingId: string) => {
    setExpandedId(prev => (prev === bookingId ? null : bookingId));
  };

  const handleStartPreparation = async (bookingId: string) => {
    startTransition(async () => {
      try {
        const result = await startParticipationAction(bookingId);
        if (result.success && result.data) {
          // Update local state with the new participation
          setEnrollments(prev =>
            prev.map(e =>
              e.booking.id === bookingId
                ? {
                    ...e,
                    participation: result.data!.participation,
                    hasSummaryAssets: result.data!.hasSummaryAssets,
                  }
                : e
            )
          );
          // Auto-expand the newly started participation
          setExpandedId(bookingId);
        } else {
          setError(
            result.error?.message || 'Fehler beim Starten der Vorbereitung'
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    });
  };

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' py={8}>
        <CircularProgress sx={{ color: colors.marsala }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Card
        elevation={0}
        sx={{
          border: `1px dashed ${colors.rosyBrown}`,
          backgroundColor: colors.beige,
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <SchoolOutlined
            sx={{ fontSize: 64, color: colors.rosyBrown, mb: 2 }}
          />
          <Typography variant='h5' sx={{ color: colors.marsala, mb: 2 }}>
            Noch keine Seminare gebucht
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Entdecke unser Seminarangebot und starte deine Lernreise.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Separate enrollments into categories:
  // - Not started: Has booking but no participation yet
  // - Active: Has participation in progress
  // - Completed: Has participation that is complete
  const notStartedEnrollments = enrollments.filter(e => !e.participation);
  const activeEnrollments = enrollments.filter(
    e => e.participation && e.participation.status !== 'COMPLETE'
  );
  const completedEnrollments = enrollments.filter(
    e => e.participation && e.participation.status === 'COMPLETE'
  );

  return (
    <Box>
      {/* Courses not yet started - User can start preparation */}
      {notStartedEnrollments.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant='h6'
            sx={{ color: colors.marsala, mb: 2, fontWeight: 600 }}
          >
            Gebuchte Seminare ({notStartedEnrollments.length})
          </Typography>

          {notStartedEnrollments.map(item => (
            <Card
              key={item.booking.id}
              elevation={0}
              sx={{
                mb: 2,
                border: `1px solid ${colors.rosyBrown}`,
                borderRadius: '8px',
              }}
            >
              <CardContent>
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent='space-between'
                  flexWrap='wrap'
                  gap={2}
                >
                  <Box>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 500, color: colors.marsala }}
                    >
                      {item.booking.course.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Kursdatum:{' '}
                      {item.booking.course.startDate
                        ? new Date(
                            item.booking.course.startDate
                          ).toLocaleDateString('de-DE')
                        : 'Noch nicht festgelegt'}
                    </Typography>
                  </Box>
                  <Button
                    variant='contained'
                    startIcon={
                      isPending ? (
                        <CircularProgress size={16} color='inherit' />
                      ) : (
                        <PlayArrowIcon />
                      )
                    }
                    disabled={isPending}
                    onClick={() => handleStartPreparation(item.booking.id)}
                    sx={{
                      backgroundColor: colors.bronze,
                      color: colors.white,
                      '&:hover': {
                        backgroundColor: colors.marsala,
                        color: colors.white,
                      },
                    }}
                  >
                    {isPending ? 'Wird gestartet...' : 'Vorbereitung starten'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Active Courses - User is working through the steps */}
      {activeEnrollments.length > 0 && (
        <Box sx={{ mb: 4 }}>
          {activeEnrollments.map(item => (
            <Accordion
              key={item.booking.id}
              expanded={expandedId === item.booking.id}
              onChange={() => handleAccordionChange(item.booking.id)}
              sx={{
                mb: 2,
                border: `1px solid ${colors.rosyBrown}`,
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                boxShadow: 'none',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: colors.marsala }} />}
                sx={{
                  backgroundColor: colors.beige,
                  borderRadius: '8px',
                  '&.Mui-expanded': {
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  },
                }}
              >
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent='space-between'
                  width='100%'
                  pr={2}
                >
                  <Box>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 500, color: colors.marsala }}
                    >
                      {item.booking.course.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Seminardatum:{' '}
                      {item.booking.course.startDate
                        ? new Date(
                            item.booking.course.startDate
                          ).toLocaleDateString('de-DE')
                        : 'Noch nicht festgelegt'}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: colors.bronzeLight,
                    }}
                  >
                    <Typography
                      variant='caption'
                      sx={{ color: colors.marsala, fontWeight: 500 }}
                    >
                      {item.participation &&
                        (statusLabels[item.participation.status] ||
                          item.participation.status)}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ pt: 3 }}>
                <CourseParticipationStepper
                  bookingId={item.booking.id}
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
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Completed Courses */}
      {completedEnrollments.length > 0 && (
        <Box>
          <Typography
            variant='h6'
            sx={{ color: colors.marsala, mb: 2, fontWeight: 600 }}
          >
            Abgeschlossene Kurse ({completedEnrollments.length})
          </Typography>

          {completedEnrollments.map(item => (
            <Card
              key={item.booking.id}
              elevation={0}
              sx={{
                mb: 2,
                border: `1px solid ${colors.rosyBrown}`,
                backgroundColor: colors.sageLight,
              }}
            >
              <CardContent>
                <Box display='flex' alignItems='center' gap={2}>
                  <SchoolOutlined
                    sx={{ color: colors.rosyBrown, fontSize: 32 }}
                  />
                  <Box>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 500, color: colors.marsala }}
                    >
                      {item.booking.course.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Abgeschlossen am{' '}
                      {item.participation?.resultCompletedAt
                        ? new Date(
                            item.participation.resultCompletedAt
                          ).toLocaleDateString('de-DE')
                        : '-'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

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

  const textFieldSx = {
    '& .MuiInputBase-root': {
      backgroundColor: colors.lightGray,
      borderRadius: '8px',
      fontSize: '14px',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: '2px solid transparent',
    },
    '&:focus-within .MuiOutlinedInput-notchedOutline': {
      borderColor: colors.marsala,
      borderWidth: '2px',
    },
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant='body2' sx={{ mb: 3, color: colors.lightBlack }}>
        Bereite dich auf den Kurs vor, indem du deine Ziele definierst.
      </Typography>

      {/* Preparation Intent */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant='subtitle2'
          sx={{ mb: 1, color: colors.marsala, fontWeight: 500 }}
        >
          Was ist deine Absicht für dieses Seminar?
        </Typography>
        <TextField
          multiline
          minRows={6}
          fullWidth
          aria-label='Vorbereitungsabsicht'
          value={preparationIntent}
          onChange={e => setPreparationIntent(e.target.value)}
          placeholder='Beschreibe, was du mit diesem Seminar erreichen möchtest...'
          sx={textFieldSx}
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
        <TextField
          multiline
          minRows={6}
          fullWidth
          aria-label='Gewünschte Ergebnisse'
          value={desiredResults}
          onChange={e => setDesiredResults(e.target.value)}
          placeholder='Welche konkreten Ergebnisse möchtest du erreichen...'
          sx={textFieldSx}
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
        <TextField
          multiline
          minRows={6}
          fullWidth
          aria-label='Profil des Vorgesetzten'
          value={lineManagerProfile}
          onChange={e => setLineManagerProfile(e.target.value)}
          placeholder='Charaktereigenschaften, Kommunikationsstil, Prioritäten deines Vorgesetzten...'
          sx={textFieldSx}
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

export default MyCoursesClient;
