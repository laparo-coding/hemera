/**
 * CourseProgressStepper Component
 *
 * 4-step horizontal timeline stepper displaying participation progress.
 * Steps: Vorbereitung → Seminarveranstaltung → Nachbereitung → Verhandlungsergebnis
 * Includes relative timeline dates based on course start date.
 *
 * Contract: ui-contracts.md §1
 */

'use client';

import { Check } from '@mui/icons-material';
import { Box, Step, StepLabel, Stepper, Typography } from '@mui/material';
import type { StepIconProps } from '@mui/material/StepIcon';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';
import { colors, typography } from '@/lib/design-tokens';
import type { ParticipationStatus } from '@/lib/types/participation';
import { shouldUnlockFutureCourseStepsInDevelopment } from '@/lib/utils/course-step-access';

export type { ParticipationStatus } from '@/lib/types/participation';

type DashboardStepKey =
  | 'VORBEREITUNG'
  | 'SEMINARVERANSTALTUNG'
  | 'NACHBEREITUNG'
  | 'VERHANDLUNGSERGEBNIS';

interface DashboardStep {
  key: DashboardStepKey;
  number: number;
  label: string;
  hrefTemplate: string;
  completedAt: ParticipationStatus[];
  activeAt: ParticipationStatus[];
  /** Timeline label relative to course start date */
  timelineLabel: string;
}

const DASHBOARD_STEPS: DashboardStep[] = [
  {
    key: 'VORBEREITUNG',
    number: 1,
    label: 'Vorbereitung Seminar',
    hrefTemplate: '/my-courses/{bookingId}/vorbereitung',
    completedAt: ['SUMMARY', 'DEBRIEFING', 'RESULT', 'COMPLETE'],
    activeAt: ['PREPARATION'],
    timelineLabel: 'Spätestens eine Woche vorher',
  },
  {
    key: 'SEMINARVERANSTALTUNG',
    number: 2,
    label: 'Seminarveranstaltung',
    hrefTemplate: '/my-courses/{bookingId}/seminarveranstaltung',
    completedAt: ['DEBRIEFING', 'RESULT', 'COMPLETE'],
    activeAt: ['SUMMARY'],
    timelineLabel: 'Seminardatum',
  },
  {
    key: 'NACHBEREITUNG',
    number: 3,
    label: 'Nachbereitung Seminar',
    hrefTemplate: '/my-courses/{bookingId}/nachbereitung',
    completedAt: ['RESULT', 'COMPLETE'],
    activeAt: ['DEBRIEFING'],
    timelineLabel: 'Einige Tage danach',
  },
  {
    key: 'VERHANDLUNGSERGEBNIS',
    number: 4,
    label: 'Verhandlungsergebnis',
    hrefTemplate: '/my-courses/{bookingId}/verhandlungsergebnis',
    completedAt: ['COMPLETE'],
    activeAt: ['RESULT'],
    timelineLabel: 'Spätestens 8 Wochen danach',
  },
];

function getStepState(
  step: DashboardStep,
  status: ParticipationStatus | null
): 'completed' | 'active' | 'available' {
  if (status && step.completedAt.includes(status)) return 'completed';
  if (status && step.activeAt.includes(status)) return 'active';
  if (!status && step.key === 'VORBEREITUNG') return 'active';
  return 'available';
}

/**
 * Compute concrete timeline dates from a course start date.
 */
function computeTimelineDates(
  courseStartDate: string | null
): [string | null, string | null, string | null, string | null] {
  if (!courseStartDate) return [null, null, null, null];
  const start = new Date(courseStartDate);
  if (Number.isNaN(start.getTime())) return [null, null, null, null];

  const fmt = (d: Date) =>
    d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  // Step 1: 1 week before
  const oneWeekBefore = new Date(start);
  oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);

  // Step 2: course start date itself
  const seminarDate = new Date(start);

  // Step 3: a few days after
  const threeDaysAfter = new Date(start);
  threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);

  // Step 4: 8 weeks later
  const eightWeeksLater = new Date(start);
  eightWeeksLater.setDate(eightWeeksLater.getDate() + 56);

  return [
    fmt(oneWeekBefore),
    fmt(seminarDate),
    fmt(threeDaysAfter),
    fmt(eightWeeksLater),
  ];
}

export interface CourseProgressStepperProps {
  bookingId: string;
  participationStatus: ParticipationStatus | null;
  /** Course start date (ISO string) for computing timeline dates */
  courseStartDate?: string | null;
}

function NumberedStepIcon({
  icon,
  active,
  completed,
  unlocked = false,
}: StepIconProps & { unlocked?: boolean }) {
  const theme = useTheme();
  const stepNumber = typeof icon === 'number' ? icon : 0;

  const isActive = active ?? false;
  const bgColor = completed
    ? colors.statusHealthy
    : isActive
      ? theme.palette.primary.main
      : unlocked
        ? colors.marsala
        : colors.lightGray;
  const textColor =
    completed || isActive || unlocked ? colors.white : colors.lightBlack;

  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        minWidth: 32,
        minHeight: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: bgColor,
        border: `2px solid ${completed || isActive ? 'transparent' : colors.tealAlpha10}`,
        transition: 'all 0.2s ease',
      }}
    >
      {completed ? (
        <Check aria-hidden='true' sx={{ color: colors.white, fontSize: 20 }} />
      ) : (
        <Typography
          sx={{
            fontFamily: typography.body,
            fontSize: '0.8rem',
            fontWeight: 700,
            color: textColor,
            lineHeight: 1,
          }}
        >
          {stepNumber}
        </Typography>
      )}
    </Box>
  );
}

export default function CourseProgressStepper({
  bookingId,
  participationStatus,
  courseStartDate,
}: CourseProgressStepperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const unlockFutureSteps =
    shouldUnlockFutureCourseStepsInDevelopment(courseStartDate);
  const stepStates = DASHBOARD_STEPS.map(step =>
    getStepState(step, participationStatus)
  );

  const activeStepIndex = stepStates.indexOf('active');
  const computedActiveStep =
    activeStepIndex >= 0 ? activeStepIndex : DASHBOARD_STEPS.length;

  const timelineDates = computeTimelineDates(courseStartDate ?? null);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant='subtitle1'
        sx={{
          fontFamily: typography.body,
          fontWeight: 600,
          mb: 0.5,
          color: colors.lightBlack,
        }}
      >
        Dein Fortschritt
      </Typography>

      {/* Hint to start with step 1 */}
      {computedActiveStep === 0 && (
        <Typography
          sx={{
            fontFamily: typography.body,
            fontSize: '1rem',
            color: colors.marsala,
            fontWeight: 500,
            mb: 1.5,
          }}
        >
          Starte jetzt mit Schritt 1 — Vorbereitung Seminar
        </Typography>
      )}

      <Stepper
        orientation={isMobile ? 'vertical' : 'horizontal'}
        alternativeLabel={!isMobile}
        activeStep={computedActiveStep}
        aria-label='Dein Fortschritt'
        sx={{
          '& .MuiStepper-root': {
            overflowX: 'hidden',
          },
          '& .MuiStepConnector-line': {
            borderTopWidth: 3,
            borderColor: colors.lightGray,
          },
          '& .MuiStep-root': {
            minWidth: 0,
          },
          '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
            borderColor: colors.marsala,
          },
          '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
            borderColor: colors.statusHealthy,
          },
        }}
      >
        {DASHBOARD_STEPS.map((step, index) => {
          const href = step.hrefTemplate.replace(
            '{bookingId}',
            encodeURIComponent(bookingId)
          );
          const state = stepStates[index];
          const timelineDate = timelineDates[index];
          const isDevUnlocked =
            unlockFutureSteps &&
            step.key !== 'VORBEREITUNG' &&
            state === 'available';

          return (
            <Step
              key={step.key}
              completed={state === 'completed'}
              active={state === 'active'}
            >
              <Link
                href={href}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: isMobile ? 'block' : 'inline',
                  width: isMobile ? '100%' : 'auto',
                }}
                aria-label={`${step.label} – ${timelineDate ?? step.timelineLabel}`}
              >
                <StepLabel
                  StepIconComponent={props => (
                    <NumberedStepIcon {...props} unlocked={isDevUnlocked} />
                  )}
                  sx={{
                    cursor: 'pointer',
                    '& .MuiStepLabel-labelContainer': {
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      minHeight: 52,
                    },
                    '& .MuiStepLabel-label': {
                      display: 'block',
                      fontFamily: typography.body,
                      fontSize: '1rem',
                      fontWeight: 400,
                      whiteSpace: { xs: 'normal', md: 'nowrap' },
                      overflowWrap: 'anywhere',
                      color:
                        state === 'active'
                          ? colors.marsala
                          : state === 'completed'
                            ? colors.statusHealthy
                            : isDevUnlocked
                              ? colors.marsala
                              : colors.lightBlack,
                      mt: 0.5,
                      lineHeight: 1.2,
                      textAlign: 'center',
                    },
                    '& .MuiStepLabel-label.MuiStepLabel-alternativeLabel': {
                      marginTop: '4px',
                    },
                    '& .MuiStepLabel-label.Mui-active': {
                      color: colors.marsala,
                      fontWeight: 400,
                      mt: 0.5,
                    },
                    '& .MuiStepLabel-label.Mui-active.MuiStepLabel-alternativeLabel':
                      {
                        marginTop: '4px',
                      },
                    '& .MuiStepLabel-label.Mui-completed': {
                      color: colors.statusHealthy,
                      fontWeight: 400,
                    },
                    '& .MuiStepLabel-label.Mui-completed.MuiStepLabel-alternativeLabel':
                      {
                        marginTop: '4px',
                      },
                  }}
                >
                  {step.label}
                  <Typography
                    sx={{
                      fontFamily: typography.body,
                      fontSize: '0.85rem',
                      color: colors.lightBlack,
                      opacity: 0.6,
                      mt: 0.25,
                      lineHeight: 1.2,
                    }}
                  >
                    {timelineDate ?? step.timelineLabel}
                  </Typography>
                </StepLabel>
              </Link>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
}
