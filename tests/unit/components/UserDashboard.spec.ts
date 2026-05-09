import { describe, expect, it } from '@jest/globals';
import { shouldShowProgressStepper } from '@/components/UserDashboard';

describe('UserDashboard progress stepper visibility', () => {
  it('shows the dashboard stepper for next seminar bookings even without participation yet', () => {
    expect(shouldShowProgressStepper('NEXT_SEMINAR')).toBe(true);
  });

  it('shows the dashboard stepper for upcoming bookings', () => {
    expect(shouldShowProgressStepper('UPCOMING')).toBe(true);
  });

  it('shows the dashboard stepper for completed bookings', () => {
    expect(shouldShowProgressStepper('COMPLETED')).toBe(true);
  });

  it('hides the dashboard stepper for no-show bookings', () => {
    expect(shouldShowProgressStepper('NO_SHOW')).toBe(false);
  });
});