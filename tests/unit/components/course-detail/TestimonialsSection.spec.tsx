/**
 * @jest-environment jsdom
 */
/**
 * TestimonialsSection Component Tests
 *
 * Feature: 013-layout-improvement-course-detail-page
 * TDD: These tests must fail before implementation
 */

import { render, screen } from '@testing-library/react';
import { TestimonialsSection } from '../../../../components/course-detail/TestimonialsSection';

describe('TestimonialsSection', () => {
  const defaultProps = {
    testimonials: [
      {
        id: 'testimonial-1',
        quote:
          'Nach dem Kurs habe ich meine erste Gehaltsverhandlung erfolgreich geführt!',
        authorName: 'Lisa M.',
        authorRole: 'Senior Manager',
        successIndicator: 'Gehaltssteigerung von 15%',
      },
      {
        id: 'testimonial-2',
        quote: 'Die Techniken haben mir geholfen, selbstbewusster aufzutreten.',
        authorName: 'Thomas K.',
        authorRole: 'Projektleiter',
        successIndicator: 'Beförderung nach 3 Monaten',
      },
      {
        id: 'testimonial-3',
        quote: 'Ein Kurs, der wirklich etwas verändert hat.',
        authorName: 'Sandra B.',
        authorRole: 'Teamleiterin',
        successIndicator: 'Bessere Kundengespräche',
      },
    ],
  };

  describe('Testimonial cards', () => {
    it('renders testimonial cards', () => {
      render(<TestimonialsSection {...defaultProps} />);

      // Use regex to find partial text since quotes may be split across elements
      expect(
        screen.getByText(
          /Nach dem Kurs habe ich meine erste Gehaltsverhandlung/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Die Techniken haben mir geholfen/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Ein Kurs, der wirklich etwas verändert hat/)
      ).toBeInTheDocument();
    });

    it('renders correct number of cards', () => {
      render(<TestimonialsSection {...defaultProps} />);

      const cards = screen.getAllByTestId('testimonial-card');
      expect(cards).toHaveLength(3);
    });
  });

  describe('Quote styling', () => {
    it('shows quote with icon', () => {
      render(<TestimonialsSection {...defaultProps} />);

      // Quote icon should be present (format quote icon or similar)
      const quoteIcons = screen.getAllByTestId('quote-icon');
      expect(quoteIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Author information', () => {
    it('displays author name and role', () => {
      render(<TestimonialsSection {...defaultProps} />);

      expect(screen.getByText('Lisa M.')).toBeInTheDocument();
      expect(screen.getByText('Senior Manager')).toBeInTheDocument();
      expect(screen.getByText('Thomas K.')).toBeInTheDocument();
      expect(screen.getByText('Projektleiter')).toBeInTheDocument();
    });
  });

  describe('Success indicator', () => {
    it('shows success indicator for each testimonial', () => {
      render(<TestimonialsSection {...defaultProps} />);

      expect(screen.getByText('Gehaltssteigerung von 15%')).toBeInTheDocument();
      expect(
        screen.getByText('Beförderung nach 3 Monaten')
      ).toBeInTheDocument();
      expect(screen.getByText('Bessere Kundengespräche')).toBeInTheDocument();
    });

    it('success indicator has visual distinction', () => {
      render(<TestimonialsSection {...defaultProps} />);

      const successIndicators = screen.getAllByTestId('success-indicator');
      expect(successIndicators).toHaveLength(3);
    });
  });

  describe('Empty state', () => {
    it('shows placeholder testimonials when no testimonials provided', () => {
      render(<TestimonialsSection testimonials={[]} />);

      // Component shows placeholder content when empty
      const cards = screen.getAllByTestId('testimonial-card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
