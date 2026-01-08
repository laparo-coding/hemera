/**
 * BookingCTA Component Tests
 *
 * Feature: 013-layout-improvement-course-detail-page
 * TDD: These tests must fail before implementation
 */

import { render, screen } from '@testing-library/react';
import { BookingCTA } from '../../../components/course-detail/BookingCTA';
import { colors } from '../../../lib/design-tokens';

describe('BookingCTA', () => {
  const defaultProps = {
    courseId: 'course-123',
    courseSlug: 'grundkurs-verhandlungstraining',
    variant: 'primary' as const,
  };

  describe('Variant styling', () => {
    it('primary variant has gold background', () => {
      render(<BookingCTA {...defaultProps} variant='primary' />);

      const button = screen.getByRole('link');
      expect(button).toHaveStyle({ backgroundColor: colors.gold });
    });

    it('secondary variant has petrol outline', () => {
      render(<BookingCTA {...defaultProps} variant='secondary' />);

      const button = screen.getByRole('link');
      expect(button).toHaveStyle({ borderColor: colors.petrol });
    });

    it('banner variant is full-width', () => {
      render(<BookingCTA {...defaultProps} variant='banner' />);

      const container = screen.getByTestId('booking-cta-banner');
      expect(container).toHaveStyle({ width: '100%' });
    });
  });

  describe('Navigation', () => {
    it('links to correct checkout URL', () => {
      render(<BookingCTA {...defaultProps} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute(
        'href',
        '/checkout?course=grundkurs-verhandlungstraining'
      );
    });

    it('includes course slug in URL', () => {
      render(
        <BookingCTA
          {...defaultProps}
          courseSlug='aufbaukurs-verhandlungstraining'
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute(
        'href',
        expect.stringContaining('aufbaukurs-verhandlungstraining')
      );
    });
  });

  describe('Price display', () => {
    it('displays price when provided', () => {
      render(<BookingCTA {...defaultProps} price={129900} currency='EUR' />);

      expect(screen.getByText(/1\.299/)).toBeInTheDocument();
    });

    it('does not show price when not provided', () => {
      render(<BookingCTA {...defaultProps} />);

      expect(screen.queryByText(/€/)).not.toBeInTheDocument();
    });

    it('formats price correctly in EUR', () => {
      render(<BookingCTA {...defaultProps} price={99900} currency='EUR' />);

      // German locale: 999,00 €
      expect(screen.getByText(/999,00\s*€/)).toBeInTheDocument();
    });
  });

  describe('Label customization', () => {
    it('uses custom label when provided', () => {
      render(<BookingCTA {...defaultProps} label='Jetzt anmelden' />);

      expect(screen.getByText('Jetzt anmelden')).toBeInTheDocument();
    });

    it('uses default label when not provided', () => {
      render(<BookingCTA {...defaultProps} />);

      expect(screen.getByText(/jetzt buchen/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible name', () => {
      render(<BookingCTA {...defaultProps} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAccessibleName();
    });
  });
});
