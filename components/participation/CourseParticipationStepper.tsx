/**
 * Course Participation Stepper
 *
 * Material-UI stepper component that guides participants through the course workflow:
 * 1. Preparation - Set intentions and upload résumé
 * 2. Summary - Watch video summaries (conditionally hidden if no assets)
 * 3. Debriefing - Plan follow-up discussions
 * 4. Results - Record negotiation outcomes
 *
 * Uses server actions for data loading and step completion.
 */

'use client';

import {
  AssignmentOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  RecordVoiceOverOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type {
  ParticipationSummary,
  ParticipationWithRelations,
} from '../../lib/actions/participation';
import {
  completeDebriefingAction,
  completePreparationAction,
  completeResultAction,
  completeSummaryAction,
  getParticipationAction,
} from '../../lib/actions/participation';
import type {
  DebriefingInput,
  PreparationInput,
  ResultInput,
} from '../../lib/db/courseParticipation';
import { colors } from '../../lib/design-tokens';

// Step definitions
export type StepKey = 'PREPARATION' | 'SUMMARY' | 'DEBRIEFING' | 'RESULT';

interface StepDefinition {
  key: StepKey;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const allSteps: StepDefinition[] = [
  {
    key: 'PREPARATION',
    label: 'Vorbereitung',
    description: 'Definiere deine Ziele und lade deinen Lebenslauf hoch.',
    icon: <AssignmentOutlined />,
  },
  {
    key: 'SUMMARY',
    label: 'Zusammenfassung',
    description: 'Sieh dir die Kurs-Zusammenfassung als Video an.',
    icon: <PlayCircleOutlined />,
  },
  {
    key: 'DEBRIEFING',
    label: 'Nachbereitung',
    description: 'Plane dein Gespräch mit deinem Vorgesetzten.',
    icon: <RecordVoiceOverOutlined />,
  },
  {
    key: 'RESULT',
    label: 'Ergebnis',
    description: 'Dokumentiere das Ergebnis deiner Verhandlung.',
    icon: <TrendingUpOutlined />,
  },
];

// Map participation status to step index
function getStepIndex(status: string, steps: StepDefinition[]): number {
  const statusToStep: Record<string, string> = {
    PREPARATION: 'PREPARATION',
    SUMMARY: 'SUMMARY',
    DEBRIEFING: 'DEBRIEFING',
    RESULT: 'RESULT',
    COMPLETE: 'COMPLETE',
  };

  const currentStep = statusToStep[status] || 'PREPARATION';

  if (currentStep === 'COMPLETE') {
    return steps.length; // All steps completed
  }

  const index = steps.findIndex(s => s.key === currentStep);
  return index >= 0 ? index : 0;
}

interface CourseParticipationStepperProps {
  bookingId: string;
  visibleStepKeys?: StepKey[];
  onStepChange?: (step: string) => void;
  /** Render props for step content */
  renderPreparation?: (props: {
    participation: ParticipationWithRelations;
    onComplete: (data: PreparationInput) => Promise<void>;
  }) => React.ReactNode;
  renderSummary?: (props: {
    participation: ParticipationWithRelations;
    onComplete: () => Promise<void>;
  }) => React.ReactNode;
  renderDebriefing?: (props: {
    participation: ParticipationWithRelations;
    onComplete: (data: DebriefingInput) => Promise<void>;
  }) => React.ReactNode;
  renderResult?: (props: {
    participation: ParticipationWithRelations;
    onComplete: (data: ResultInput) => Promise<void>;
  }) => React.ReactNode;
}

export const CourseParticipationStepper: React.FC<
  CourseParticipationStepperProps
> = ({
  bookingId,
  visibleStepKeys,
  onStepChange,
  renderPreparation,
  renderSummary,
  renderDebriefing,
  renderResult,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ParticipationSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load participation data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getParticipationAction(bookingId);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Fehler beim Laden der Daten');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter steps based on summary asset availability and caller context
  const visibleSteps = allSteps.filter(step => {
    if (visibleStepKeys && !visibleStepKeys.includes(step.key)) {
      return false;
    }

    if (step.key === 'SUMMARY') {
      return data?.hasSummaryAssets ?? false;
    }

    return true;
  });

  const activeStep = data
    ? getStepIndex(data.participation.status, visibleSteps)
    : 0;

  // Notify parent of step changes
  useEffect(() => {
    if (data && onStepChange) {
      onStepChange(data.participation.status);
    }
  }, [data, onStepChange]);

  // Step completion handlers
  const handleCompletePreparation = useCallback(
    async (inputData: PreparationInput) => {
      if (!data) return;
      setSubmitting(true);
      try {
        const result = await completePreparationAction(bookingId, inputData);
        if (result.success) {
          await loadData();
        } else {
          setError(result.error?.message || 'Fehler beim Abschließen');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [bookingId, data, loadData]
  );

  const handleCompleteSummary = useCallback(async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      const result = await completeSummaryAction(bookingId);
      if (result.success) {
        await loadData();
      } else {
        setError(result.error?.message || 'Fehler beim Abschließen');
      }
    } finally {
      setSubmitting(false);
    }
  }, [bookingId, data, loadData]);

  const handleCompleteDebriefing = useCallback(
    async (inputData: DebriefingInput) => {
      if (!data) return;
      setSubmitting(true);
      try {
        const result = await completeDebriefingAction(bookingId, inputData);
        if (result.success) {
          await loadData();
        } else {
          setError(result.error?.message || 'Fehler beim Abschließen');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [bookingId, data, loadData]
  );

  const handleCompleteResult = useCallback(
    async (inputData: ResultInput) => {
      if (!data) return;
      setSubmitting(true);
      try {
        const result = await completeResultAction(bookingId, inputData);
        if (result.success) {
          await loadData();
        } else {
          setError(result.error?.message || 'Fehler beim Abschließen');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [bookingId, data, loadData]
  );

  // Render step content
  const renderStepContent = (step: StepDefinition, index: number) => {
    if (!data) return null;

    const isActive = index === activeStep;
    const isCompleted = index < activeStep;

    if (!isActive) {
      return isCompleted ? (
        <Typography variant='body2' color='text.secondary'>
          ✓ Abgeschlossen
        </Typography>
      ) : null;
    }

    switch (step.key) {
      case 'PREPARATION':
        return renderPreparation ? (
          renderPreparation({
            participation: data.participation,
            onComplete: handleCompletePreparation,
          })
        ) : (
          <DefaultStepContent
            description={step.description}
            onComplete={() => handleCompletePreparation({})}
            submitting={submitting}
          />
        );

      case 'SUMMARY':
        return renderSummary ? (
          renderSummary({
            participation: data.participation,
            onComplete: handleCompleteSummary,
          })
        ) : (
          <DefaultStepContent
            description={step.description}
            onComplete={handleCompleteSummary}
            submitting={submitting}
          />
        );

      case 'DEBRIEFING':
        return renderDebriefing ? (
          renderDebriefing({
            participation: data.participation,
            onComplete: handleCompleteDebriefing,
          })
        ) : (
          <DefaultStepContent
            description={step.description}
            onComplete={() => handleCompleteDebriefing({})}
            submitting={submitting}
          />
        );

      case 'RESULT':
        return renderResult ? (
          renderResult({
            participation: data.participation,
            onComplete: handleCompleteResult,
          })
        ) : (
          <DefaultStepContent
            description={step.description}
            onComplete={() => handleCompleteResult({})}
            submitting={submitting}
            isLast
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' py={4}>
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

  if (!data) {
    return <Alert severity='warning'>Keine Teilnahmedaten gefunden.</Alert>;
  }

  const isComplete = data.participation.status === 'COMPLETE';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: `1px solid ${colors.rosyBrown}`,
        borderRadius: 2,
        backgroundColor: colors.white,
      }}
    >
      <Typography variant='h6' sx={{ mb: 3, color: colors.marsala }}>
        {data.participation.booking.course.title}
      </Typography>

      {isComplete && (
        <Alert severity='success' icon={<CheckCircleOutlined />} sx={{ mb: 3 }}>
          Herzlichen Glückwunsch! Du hast alle Schritte abgeschlossen.
        </Alert>
      )}

      <Stepper activeStep={activeStep} orientation='vertical'>
        {visibleSteps.map((step, index) => (
          <Step key={step.key} completed={index < activeStep}>
            <StepLabel
              StepIconProps={{
                sx: {
                  color:
                    index <= activeStep ? colors.marsala : colors.rosyBrown,
                  '&.Mui-active': { color: colors.bronze },
                  '&.Mui-completed': { color: colors.rosyBrown },
                },
              }}
            >
              <Box display='flex' alignItems='center' gap={1}>
                {step.icon}
                <Typography
                  variant='subtitle1'
                  sx={{
                    fontWeight: index === activeStep ? 600 : 400,
                    color: colors.marsala,
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            </StepLabel>
            <StepContent>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                {step.description}
              </Typography>
              {renderStepContent(step, index)}
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

// Default step content with simple complete button
interface DefaultStepContentProps {
  description: string;
  onComplete: () => Promise<void>;
  submitting: boolean;
  isLast?: boolean;
}

const DefaultStepContent: React.FC<DefaultStepContentProps> = ({
  onComplete,
  submitting,
  isLast,
}) => (
  <Box sx={{ mt: 2 }}>
    <Button
      variant='contained'
      onClick={onComplete}
      disabled={submitting}
      sx={{
        backgroundColor: colors.marsala,
        '&:hover': { backgroundColor: colors.bronze },
      }}
    >
      {submitting ? (
        <CircularProgress size={20} sx={{ color: colors.white }} />
      ) : isLast ? (
        'Abschließen'
      ) : (
        'Weiter'
      )}
    </Button>
  </Box>
);

export default CourseParticipationStepper;
