/** @jest-environment jsdom */

import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import PreparationSection, {
  canStartPreparation,
} from '@/app/my-courses/[bookingId]/PreparationSection';

jest.mock('@/lib/actions/participation', () => ({
  startParticipationAction: jest.fn(),
}));

jest.mock('@/components/participation', () => ({
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
        'Deine Zahlung ist noch ausstehend. Du kannst die Vorbereitung starten, sobald deine Buchung bezahlt oder bestätigt ist.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Starte jetzt deine Vorbereitung, um das Beste aus deinem Seminar herauszuholen.'
      )
    ).not.toBeInTheDocument();
  });
});