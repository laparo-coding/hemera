/**
 * @jest-environment jsdom
 */
/**
 * CurriculumSection Component Tests
 *
 * Feature: 013-layout-improvement-course-detail-page
 * TDD: These tests must fail before implementation
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { CurriculumSection } from '../../../../components/course-detail/CurriculumSection';

describe('CurriculumSection', () => {
  const defaultProps = {
    modules: [
      {
        id: 'day-1',
        day: 1,
        title: 'Tag 1: Grundlagen',
        topics: [
          {
            id: 'topic-1',
            timeRange: '09:00 - 09:20',
            title: 'Vorstellungsrunde',
          },
          {
            id: 'topic-2',
            timeRange: '09:20 - 10:00',
            title: 'Vorbereitungen besprechen',
          },
          { id: 'topic-3', timeRange: '10:00 - 10:15', title: 'Pause' },
        ],
      },
      {
        id: 'day-2',
        day: 2,
        title: 'Tag 2: Vertiefung',
        topics: [
          { id: 'topic-4', timeRange: '09:00 - 12:00', title: 'Praxisübungen' },
        ],
      },
    ],
  };

  describe('Accordion rendering', () => {
    it('renders accordion for each module', () => {
      render(<CurriculumSection {...defaultProps} />);

      expect(screen.getByText('Tag 1: Grundlagen')).toBeInTheDocument();
      expect(screen.getByText('Tag 2: Vertiefung')).toBeInTheDocument();
    });

    it('first accordion is expanded by default', () => {
      render(<CurriculumSection {...defaultProps} />);

      // First module topics should be visible
      expect(screen.getByText('Vorstellungsrunde')).toBeVisible();
    });

    it('can expand and collapse accordions', () => {
      render(<CurriculumSection {...defaultProps} />);

      // Click on second accordion to expand it
      const secondAccordion = screen.getByText('Tag 2: Vertiefung');
      fireEvent.click(secondAccordion);

      expect(screen.getByText('Praxisübungen')).toBeVisible();
    });
  });

  describe('Topics table format', () => {
    it('topics are displayed in table format', () => {
      render(<CurriculumSection {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('displays time format "HH:MM - HH:MM"', () => {
      render(<CurriculumSection {...defaultProps} />);

      expect(screen.getByText('09:00 - 09:20')).toBeInTheDocument();
      expect(screen.getByText('09:20 - 10:00')).toBeInTheDocument();
      expect(screen.getByText('10:00 - 10:15')).toBeInTheDocument();
    });

    it('displays topic titles', () => {
      render(<CurriculumSection {...defaultProps} />);

      expect(screen.getByText('Vorstellungsrunde')).toBeInTheDocument();
      expect(screen.getByText('Vorbereitungen besprechen')).toBeInTheDocument();
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders nothing when no modules provided', () => {
      const { container } = render(<CurriculumSection modules={[]} />);

      // Component returns null when empty, so container should be empty
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when modules is undefined', () => {
      const { container } = render(<CurriculumSection modules={undefined} />);

      // Component returns null with undefined, so container should be empty
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when modules is null', () => {
      const { container } = render(<CurriculumSection modules={null} />);

      // Component returns null with null, so container should be empty
      expect(container.firstChild).toBeNull();
    });
  });
});
