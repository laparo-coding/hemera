/** @jest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PreparationSection, {
  canStartPreparation,
} from '@/app/my-courses/[bookingId]/PreparationSection';

vi.mock('@/lib/actions/participation', () => ({
  startParticipationAction: vi.fn(),
}));

vi.mock('@/components/participation', () => ({
  CourseParticipationStepper: () => null,
  ResumeUploader: () => null,
  SummaryAssetList: () => null,
}));

describe('PreparationSection availability', () => {
  it('allows preparation for paid bookings', () => {
    expect(canStartPreparation('PAID')).toBe(true);
  });

  it('allows preparation for confirmed bookings', () => {
    expect(canStartPreparation('CONFIRMED')).toBe(true);
  });

  it('blocks preparation for pending bookings', () => {
    expect(canStartPreparation('PENDING')).toBe(false);
  });

  it('blocks preparation for pre-booked bookings', () => {
    expect(canStartPreparation('PRE_BOOKED')).toBe(false);
  });

  it('blocks preparation for failed bookings', () => {
    expect(canStartPreparation('FAILED')).toBe(false);
  });

  it('blocks preparation for cancelled bookings', () => {
    expect(canStartPreparation('CANCELLED')).toBe(false);
  });

  it('blocks preparation for refunded bookings', () => {
    expect(canStartPreparation('REFUNDED')).toBe(false);
  });

  it('hides the preparation encouragement copy when payment is still pending', () => {
    render(
      <PreparationSection
        bookingId='booking-1'
        hasParticipation={false}
        paymentStatus='PENDING'
      />
    );

    expect(
      screen.getByText(
        'Deine Zahlung ist noch ausstehend. Du kannst die Vorbereitung ' +
          'starten, sobald deine Buchung bezahlt oder bestätigt ist.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Starte jetzt deine Vorbereitung, um das Beste aus deinem Seminar ' +
          'herauszuholen.'
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Vorbereitung starten/i })
    ).not.toBeInTheDocument();
  });

  it('shows the preparation encouragement copy for paid bookings', () => {
    render(
      <PreparationSection
        bookingId='booking-1'
        hasParticipation={false}
        paymentStatus='PAID'
      />
    );

    expect(
      screen.getByText(
        'Starte jetzt deine Vorbereitung, um das Beste aus deinem Seminar ' +
          'herauszuholen.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Deine Zahlung ist noch ausstehend. Du kannst die Vorbereitung ' +
          'starten, sobald deine Buchung bezahlt oder bestätigt ist.'
      )
    ).not.toBeInTheDocument();
  });
});