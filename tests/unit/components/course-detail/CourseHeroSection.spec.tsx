/**
 * CourseHeroSection Component Tests
 *
 * Feature: 013-layout-improvement-course-detail-page
 * TDD: These tests must fail before implementation
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { CourseHeroSection } from '../../../components/course-detail/CourseHeroSection';

// Mock MuxPlayer to avoid SSR issues in tests
jest.mock('@mux/mux-player-react', () => ({
  __esModule: true,
  default: ({ playbackId }: { playbackId: string }) => (
    <div data-testid='mux-player' data-playback-id={playbackId}>
      Mux Player Mock
    </div>
  ),
}));

describe('CourseHeroSection', () => {
  const defaultProps = {
    title: 'Grundkurs Verhandlungstraining',
    level: 'BEGINNER' as const,
    tagline: 'Lerne die Kunst der Verhandlung',
    heroVideoPlaybackId: 'test-playback-id-123',
    fallbackImageUrl: '/images/course-fallback.jpg',
    onBookingClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Title rendering', () => {
    it('renders title with h1 tag', () => {
      render(<CourseHeroSection {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Grundkurs Verhandlungstraining');
    });

    it('renders tagline when provided', () => {
      render(<CourseHeroSection {...defaultProps} />);

      expect(
        screen.getByText('Lerne die Kunst der Verhandlung')
      ).toBeInTheDocument();
    });
  });

  describe('Video player', () => {
    it('shows Mux player when heroVideoPlaybackId is provided', () => {
      render(<CourseHeroSection {...defaultProps} />);

      const player = screen.getByTestId('mux-player');
      expect(player).toBeInTheDocument();
      expect(player).toHaveAttribute(
        'data-playback-id',
        'test-playback-id-123'
      );
    });

    it('shows fallback image when heroVideoPlaybackId is null', () => {
      render(
        <CourseHeroSection {...defaultProps} heroVideoPlaybackId={null} />
      );

      expect(screen.queryByTestId('mux-player')).not.toBeInTheDocument();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Level badge', () => {
    it('displays level badge with correct label for BEGINNER', () => {
      render(<CourseHeroSection {...defaultProps} level='BEGINNER' />);

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('displays level badge with correct label for INTERMEDIATE', () => {
      render(<CourseHeroSection {...defaultProps} level='INTERMEDIATE' />);

      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('displays level badge with correct label for ADVANCED', () => {
      render(<CourseHeroSection {...defaultProps} level='ADVANCED' />);

      expect(screen.getByText('C')).toBeInTheDocument();
    });
  });

  describe('Booking CTA', () => {
    it('renders booking CTA button', () => {
      render(<CourseHeroSection {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /jetzt buchen/i })
      ).toBeInTheDocument();
    });

    it('calls onBookingClick when CTA is clicked', () => {
      const onBookingClick = jest.fn();
      render(
        <CourseHeroSection {...defaultProps} onBookingClick={onBookingClick} />
      );

      fireEvent.click(screen.getByRole('button', { name: /jetzt buchen/i }));

      expect(onBookingClick).toHaveBeenCalledTimes(1);
    });
  });
});
