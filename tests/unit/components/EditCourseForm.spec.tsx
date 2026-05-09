/** @jest-environment jsdom */

/**
 * Regression tests for EditCourseForm – price double-conversion bug.
 *
 * Before the fix, zodResolver applied the euro→cents transform *and* then
 * updateCourseAction applied it a second time, storing 100× the correct value.
 * These tests verify the end-to-end flow from form submission to the value
 * passed to the server action.
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// --- mocks ---------------------------------------------------------------

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock('@/lib/actions/admin/courses', () => ({
  updateCourseAction: jest.fn(),
}));

jest.mock('@/components/admin/FileUpload', () => ({
  __esModule: true,
  default: () => <div data-testid='file-upload'>FileUpload</div>,
}));

jest.mock('@/components/admin/CurriculumEditor', () => ({
  __esModule: true,
  default: () => <div data-testid='curriculum-editor'>CurriculumEditor</div>,
}));

// -------------------------------------------------------------------------

import EditCourseForm from '@/app/admin/courses/[id]/edit/EditCourseForm';
import { updateCourseAction } from '@/lib/actions/admin/courses';

const mockUpdateCourseAction = updateCourseAction as jest.MockedFunction<
  typeof updateCourseAction
>;

const baseCourse = {
  id: 'course-abc',
  title: 'Verhandlungstraining',
  description: 'Eine ausführliche Beschreibung des Seminars.',
  teaser: null,
  // Price stored in DB as cents (30000 = 300 EUR)
  price: 30000,
  startDate: new Date('2026-07-01T00:00:00.000Z').toISOString(),
  endDate: null,
  startTime: new Date('2026-07-01T09:00:00.000Z').toISOString(),
  endTime: new Date('2026-07-01T17:00:00.000Z').toISOString(),
  instructor: 'Max Mustermann',
  level: 'BEGINNER' as const,
  thumbnailUrl: null,
  imageDetail: null,
  imageTwitter: null,
  capacity: 10,
  updatedAt: new Date('2026-05-01T00:00:00.000Z').toISOString(),
  locationId: null,
  curriculum: null,
  isPublished: false,
  recommended: null,
  notRecommended: null,
  isNonPublic: false,
};

describe('EditCourseForm', () => {
  beforeEach(() => {
    mockUpdateCourseAction.mockResolvedValue({ success: true, data: { id: 'course-abc' } });
  });

  it('passes the raw euro price (not double-converted cents) to updateCourseAction', async () => {
    render(<EditCourseForm course={baseCourse} locations={[]} />);

    // Price input must display 300 (euros) not 30000 (cents)
    const priceInput = screen.getByLabelText(/Preis/i);
    expect(priceInput).toHaveValue(300);

    // Submit the form
    fireEvent.submit(
      screen.getByRole('button', { name: /aktualisieren/i }).closest('form')!
    );

    await waitFor(() => expect(mockUpdateCourseAction).toHaveBeenCalled());

    const [, payload] = mockUpdateCourseAction.mock.calls[0] as [
      string,
      { price?: number; updatedAt: string | Date },
    ];
    // The form must submit the raw euro value (300), not the already-transformed
    // cent value (30000). The server action schema applies the ×100 conversion once.
    expect(payload.price).toBe(300);
  });

  it('shows a German error message when updateCourseAction returns an error', async () => {
    mockUpdateCourseAction.mockResolvedValue({
      success: false,
      error: 'Kurs konnte nicht aktualisiert werden',
    });

    render(<EditCourseForm course={baseCourse} locations={[]} />);

    fireEvent.submit(
      screen.getByRole('button', { name: /aktualisieren/i }).closest('form')!
    );

    await waitFor(() =>
      expect(
        screen.getByText('Kurs konnte nicht aktualisiert werden')
      ).toBeInTheDocument()
    );
  });
});
