/**
 * @jest-environment jsdom
 */
/**
 * T006: Unit Test - CourseProgressStepper Component
 *
 * Tests for the 4-step horizontal MUI Stepper that displays participation
 * progress on the dashboard. Contract: ui-contracts.md §1
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from '@/tests/vitest/jest-globals';
import type { ReactNode } from 'react';

// Mock next/link
vi.mock('next/link', () => {
  return {
    default: ({
      children,
      href,
      ...props
    }: { children: ReactNode; href: string; [key: string]: unknown }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

// Mock MUI ThemeProvider
vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual<typeof import('@mui/material/styles')>(
    '@mui/material/styles'
  );
  return {
    ...actual,
    useTheme: () => ({
      breakpoints: {
        down: () => '@media (max-width:599.95px)',
      },
      palette: {
        primary: { main: '#884143' },
        text: { secondary: '#666', disabled: '#999' },
      },
    }),
  };
});

import CourseProgressStepper from '@/components/dashboard/CourseProgressStepper';

const BOOKING_ID = 'booking-123';
const futureCourseStartDate = '2099-06-15T12:00:00.000Z';
const startedCourseStartDate = '2020-06-15T12:00:00.000Z';

function formatTimelineDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
  });
}

describe('CourseProgressStepper', () => {
  it('renders 4 steps with correct labels', () => {
    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus={null}
      />,
    );

    expect(screen.getByText('Vorbereitung Seminar')).toBeInTheDocument();
    expect(screen.getByText('Seminarveranstaltung')).toBeInTheDocument();
    expect(screen.getByText('Nachbereitung Seminar')).toBeInTheDocument();
    expect(screen.getByText('Verhandlungsergebnis')).toBeInTheDocument();
  });

  it('renders heading "Dein Fortschritt"', () => {
    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus={null}
      />,
    );

    expect(screen.getByText('Dein Fortschritt')).toBeInTheDocument();
  });

  it('shows hint to start with step 1 when no participation', () => {
    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus={null}
      />,
    );

    expect(
      screen.getByText(
        'Starte jetzt mit Schritt 1 — Vorbereitung Seminar',
      ),
    ).toBeInTheDocument();
  });

  it('shows all completed when participationStatus is COMPLETE', () => {
    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus="COMPLETE"
      />,
    );

    // All 4 steps have Check icon
    const completedIcons = screen.getAllByTestId('CheckIcon');
    expect(completedIcons).toHaveLength(4);
  });

  it('all steps are clickable links when seminar date is unlocked', () => {
    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus="PREPARATION"
        courseStartDate={startedCourseStartDate}
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });

  it('locks steps after preparation before seminar start in production-like environments', () => {
    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus="PREPARATION"
        courseStartDate={futureCourseStartDate}
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);

    expect(screen.getByText('Seminarveranstaltung').closest('a')).toBeNull();
    expect(screen.getByText('Nachbereitung Seminar').closest('a')).toBeNull();
    expect(screen.getByText('Verhandlungsergebnis').closest('a')).toBeNull();
  });

  it('keeps later steps clickable in development before seminar start', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'development';
      render(
        <CourseProgressStepper
          bookingId={BOOKING_ID}
          participationStatus="PREPARATION"
          courseStartDate={futureCourseStartDate}
        />,
      );

      expect(screen.getAllByRole('link')).toHaveLength(4);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('vorbereitung step links to correct URL', () => {
    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus="PREPARATION"
      />,
    );

    const step = screen.getByRole('link', { name: /Vorbereitung Seminar/ });
    expect(step).toHaveAttribute('href', `/my-courses/${BOOKING_ID}/vorbereitung`);
  });

  it('seminarveranstaltung step links to correct URL', () => {
    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus="SUMMARY"
        courseStartDate={startedCourseStartDate}
      />,
    );

    const step = screen.getByRole('link', { name: /Seminarveranstaltung/ });
    expect(step).toHaveAttribute('href', `/my-courses/${BOOKING_ID}/seminarveranstaltung`);
  });

  it('nachbereitung step links to correct URL', () => {
    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus="DEBRIEFING"
        courseStartDate={startedCourseStartDate}
      />,
    );

    const step = screen.getByRole('link', { name: /Nachbereitung Seminar/ });
    expect(step).toHaveAttribute('href', `/my-courses/${BOOKING_ID}/nachbereitung`);
  });

  it('verhandlungsergebnis step links to correct URL', () => {
    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus="RESULT"
        courseStartDate={startedCourseStartDate}
      />,
    );

    const step = screen.getByRole('link', { name: /Verhandlungsergebnis/ });
    expect(step).toHaveAttribute('href', `/my-courses/${BOOKING_ID}/verhandlungsergebnis`);
  });

  it('renders timeline labels when no courseStartDate', () => {
    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus={null}
      />,
    );

    expect(screen.getByText('Spätestens eine Woche vorher')).toBeInTheDocument();
    expect(screen.getByText('Seminardatum')).toBeInTheDocument();
    expect(screen.getByText('Einige Tage danach')).toBeInTheDocument();
    expect(
      screen.getByText('Spätestens 8 Wochen danach'),
    ).toBeInTheDocument();
  });

  it('renders computed dates when courseStartDate is provided', () => {
    const start = new Date('2026-06-15T12:00:00.000Z');
    const oneWeekBefore = new Date(start);
    oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
    const threeDaysAfter = new Date(start);
    threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);
    const eightWeeksLater = new Date(start);
    eightWeeksLater.setDate(eightWeeksLater.getDate() + 56);

    render(
      <CourseProgressStepper
        bookingId={BOOKING_ID}
        participationStatus={null}
        courseStartDate="2026-06-15T12:00:00.000Z"
      />,
    );

    expect(screen.getByText(formatTimelineDate(oneWeekBefore))).toBeInTheDocument();
    expect(screen.getByText(formatTimelineDate(start))).toBeInTheDocument();
    expect(screen.getByText(formatTimelineDate(threeDaysAfter))).toBeInTheDocument();
    expect(screen.getByText(formatTimelineDate(eightWeeksLater))).toBeInTheDocument();
  });
});
