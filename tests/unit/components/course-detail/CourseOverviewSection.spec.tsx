/**
 * @jest-environment jsdom
 */
/**
 * CourseOverviewSection Component Tests
 *
 * Feature: 013-layout-improvement-course-detail-page
 * TDD: These tests must fail before implementation
 */

import { render, screen } from '@testing-library/react';
import { CourseOverviewSection } from '../../../../components/course-detail/CourseOverviewSection';

describe('CourseOverviewSection', () => {
  const defaultProps = {
    description:
      'In diesem Kurs lernst du die wichtigsten Verhandlungstechniken.',
    learningObjectives: [
      'Vorbereitung auf Verhandlungen',
      'Argumentationstechniken',
      'Umgang mit schwierigen Situationen',
    ],
    instructor: 'Dr. Maria Schmidt',
    courseId: 'test-course-id',
    courseSlug: 'verhandlungstechniken',
  };

  describe('Description rendering', () => {
    it('renders description text', () => {
      render(<CourseOverviewSection {...defaultProps} />);

      expect(
        screen.getByText(
          'In diesem Kurs lernst du die wichtigsten Verhandlungstechniken.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Learning objectives', () => {
    it('displays learning objectives as list', () => {
      render(<CourseOverviewSection {...defaultProps} />);

      expect(
        screen.getByText('Vorbereitung auf Verhandlungen')
      ).toBeInTheDocument();
      expect(screen.getByText('Argumentationstechniken')).toBeInTheDocument();
      expect(
        screen.getByText('Umgang mit schwierigen Situationen')
      ).toBeInTheDocument();
    });

    it('renders learning objectives in a list element', () => {
      render(<CourseOverviewSection {...defaultProps} />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    it('handles empty learning objectives gracefully', () => {
      render(
        <CourseOverviewSection {...defaultProps} learningObjectives={[]} />
      );

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('Instructor display', () => {
    it('shows instructor name', () => {
      render(<CourseOverviewSection {...defaultProps} />);

      expect(screen.getByText('Dr. Maria Schmidt')).toBeInTheDocument();
    });

    it('displays instructor label', () => {
      render(<CourseOverviewSection {...defaultProps} />);

      expect(screen.getByText(/seminarleitung|instructor/i)).toBeInTheDocument();
    });
  });
});
