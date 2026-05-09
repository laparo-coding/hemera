/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
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
});