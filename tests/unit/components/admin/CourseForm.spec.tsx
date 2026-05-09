/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, jest } from '@jest/globals';
import CourseForm from '@/components/admin/CourseForm';

jest.mock('@/components/admin/FileUpload', () => ({
  __esModule: true,
  default: () => <div data-testid='file-upload'>FileUpload</div>,
}));

jest.mock('@/components/admin/CurriculumEditor', () => ({
  __esModule: true,
  default: ({ value }: { value: Array<unknown> | null | undefined }) => (
    <div data-testid='curriculum-editor'>
      Curriculum modules: {value?.length ?? 0}
    </div>
  ),
}));

describe('CourseForm', () => {
  it('renders the curriculum section without duplicating wrapper copy', () => {
    const mockOnSubmit = jest.fn();

    render(
      <CourseForm
        initialData={{
          title: 'Testseminar',
          description: 'Beschreibung',
          price: 9900,
          startDate: new Date('2026-06-01T00:00:00.000Z'),
          startTime: new Date('2026-06-01T09:00:00.000Z'),
          endTime: new Date('2026-06-01T17:00:00.000Z'),
          instructor: 'Max Mustermann',
          level: 'BEGINNER',
          capacity: 12,
          curriculum: [
            {
              id: 'module-1',
              day: 1,
              title: 'Tag 1',
              topics: [
                {
                  id: 'topic-1',
                  timeRange: '09:00 - 09:30',
                  title: 'Einführung',
                },
              ],
            },
          ],
        }}
        locations={[]}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByRole('region', { name: 'Curriculum' })).toBeInTheDocument();
    expect(screen.getByTestId('curriculum-editor')).toHaveTextContent(
      'Curriculum modules: 1'
    );
  });

  it('submits raw euro price without double-converting to cents', async () => {
    // Regression test: zodResolver with { raw: true } must not apply the schema
    // transform (euros → cents) before onSubmit. The server action applies the
    // conversion once; a second conversion would produce 100× the correct value.
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <CourseForm
        initialData={{
          title: 'Preistest',
          description: 'Beschreibung für den Preistest',
          // price passed as cents (from DB), form converts to euros for display
          price: 30000,
          startDate: new Date('2026-06-01T00:00:00.000Z'),
          startTime: new Date('2026-06-01T09:00:00.000Z'),
          endTime: new Date('2026-06-01T17:00:00.000Z'),
          instructor: 'Max Mustermann',
          level: 'BEGINNER',
          capacity: 10,
        }}
        locations={[]}
        onSubmit={mockOnSubmit}
      />
    );

    // The price input should display 300 (euros), not 30000 (cents)
    const priceInput = screen.getByLabelText(/Preis/i);
    expect(priceInput).toHaveValue(300);

    // Submit the form
    fireEvent.submit(screen.getByRole('button', { name: /speichern/i }).closest('form')!);

    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalled());

    // onSubmit must receive the raw euro value (300), not the transformed cent value (30000)
    const submittedData = mockOnSubmit.mock.calls[0]?.[0] as { price: number };
    expect(submittedData.price).toBe(300);
  });
});