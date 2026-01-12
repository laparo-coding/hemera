/**
 * @jest-environment jsdom
 */
/**
 * DatesPricingSection Component Tests
 *
 * Feature: 013-layout-improvement-course-detail-page
 * TDD: These tests must fail before implementation
 */

import { render, screen } from '@testing-library/react';
import { DatesPricingSection } from '../../../../components/course-detail/DatesPricingSection';

describe('DatesPricingSection', () => {
  const defaultProps = {
    price: 129900, // in cents
    currency: 'EUR',
    startDate: new Date('2026-03-15'),
    startTime: new Date('2026-03-15T09:00:00'),
    endTime: new Date('2026-03-15T17:00:00'),
    location: {
      name: 'Hemera Academy',
      city: 'München',
    },
    courseId: 'course-123',
    courseSlug: 'grundkurs-verhandlungstraining',
  };

  describe('Price formatting', () => {
    it('formats price with "inkl. 19% MwSt." suffix', () => {
      render(<DatesPricingSection {...defaultProps} />);

      expect(screen.getByText(/1\.299,00\s*€/)).toBeInTheDocument();
      expect(screen.getByText(/inkl\.\s*19%\s*MwSt\./i)).toBeInTheDocument();
    });

    it('displays price in EUR format', () => {
      render(<DatesPricingSection {...defaultProps} />);

      // German locale formatting: 1.299,00 €
      expect(screen.getByText(/1\.299/)).toBeInTheDocument();
    });
  });

  describe('Date formatting', () => {
    it('formats date in German locale', () => {
      render(<DatesPricingSection {...defaultProps} />);

      // German date format: 15. März 2026
      expect(screen.getByText(/15\.\s*März\s*2026/i)).toBeInTheDocument();
    });

    it('shows time range', () => {
      render(<DatesPricingSection {...defaultProps} />);

      expect(screen.getByText(/09:00/)).toBeInTheDocument();
      expect(screen.getByText(/17:00/)).toBeInTheDocument();
    });

    it('handles null date gracefully', () => {
      render(<DatesPricingSection {...defaultProps} startDate={null} />);

      expect(screen.getByText(/termin wird bekannt/i)).toBeInTheDocument();
    });
  });

  describe('Location display', () => {
    it('displays location name and city', () => {
      render(<DatesPricingSection {...defaultProps} />);

      // Location is displayed as combined text: "Name, City"
      expect(screen.getByText(/Hemera Academy.*München/)).toBeInTheDocument();
    });

    it('handles null location gracefully', () => {
      render(<DatesPricingSection {...defaultProps} location={null} />);

      expect(screen.getByText(/online|ort wird bekannt/i)).toBeInTheDocument();
    });
  });

  describe('Booking CTA', () => {
    it('CTA links to /checkout with course slug', () => {
      render(<DatesPricingSection {...defaultProps} />);

      const ctaLink = screen.getByRole('link', { name: /buchen/i });
      expect(ctaLink).toHaveAttribute(
        'href',
        expect.stringContaining('/checkout')
      );
      expect(ctaLink).toHaveAttribute(
        'href',
        expect.stringContaining('grundkurs-verhandlungstraining')
      );
    });
  });
});
