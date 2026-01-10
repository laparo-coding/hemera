/**
 * @jest-environment jsdom
 */
/**
 * CourseHeroSection Component Tests
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Tests for the minimal hero video section component.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { CourseHeroSection } from '../../../../components/course-detail/CourseHeroSection';

// Mock next/dynamic to return the component directly
jest.mock(
  'next/dynamic',
  () => (fn: () => Promise<{ default: React.ComponentType<unknown> }>) => {
    const Component = jest.requireActual('react').lazy(fn);
    Component.preload = jest.fn();
    return Component;
  }
);

// Mock MuxPlayer
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
    courseId: 'course-123',
    courseSlug: 'grundkurs-verhandlungstraining',
  };

  describe('Video player', () => {
    it('shows Mux player when heroVideoPlaybackId is provided', async () => {
      render(<CourseHeroSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('mux-player')).toBeInTheDocument();
      });

      const player = screen.getByTestId('mux-player');
      expect(player).toHaveAttribute(
        'data-playback-id',
        'test-playback-id-123'
      );
    });

    it('returns null when heroVideoPlaybackId is null', () => {
      const { container } = render(
        <CourseHeroSection {...defaultProps} heroVideoPlaybackId={null} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Section rendering', () => {
    it('renders hero section with correct test id', () => {
      render(<CourseHeroSection {...defaultProps} />);

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('has accessible aria-label with course title', () => {
      render(<CourseHeroSection {...defaultProps} />);

      const section = screen.getByTestId('hero-section');
      expect(section).toHaveAttribute(
        'aria-label',
        'Kursvideo: Grundkurs Verhandlungstraining'
      );
    });
  });
});
