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

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-testid='hero-image' {...props} />
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

    it('shows fallback image when no video but image is provided', () => {
      render(
        <CourseHeroSection
          {...defaultProps}
          heroVideoPlaybackId={null}
          fallbackImageUrl='/images/course-thumbnail.jpg'
        />
      );

      const image = screen.getByTestId('hero-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/images/course-thumbnail.jpg');
      expect(image).toHaveAttribute('alt', 'Grundkurs Verhandlungstraining');
    });

    it('returns null when no video and no image provided', () => {
      const { container } = render(
        <CourseHeroSection
          {...defaultProps}
          heroVideoPlaybackId={null}
          fallbackImageUrl={null}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Section rendering', () => {
    it('renders hero section with correct test id', () => {
      render(<CourseHeroSection {...defaultProps} />);

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('has accessible aria-label for video', () => {
      render(<CourseHeroSection {...defaultProps} />);

      const section = screen.getByTestId('hero-section');
      expect(section).toHaveAttribute(
        'aria-label',
        'Kursvideo: Grundkurs Verhandlungstraining'
      );
    });

    it('has accessible aria-label for image fallback', () => {
      render(
        <CourseHeroSection
          {...defaultProps}
          heroVideoPlaybackId={null}
          fallbackImageUrl='/images/course-thumbnail.jpg'
        />
      );

      const section = screen.getByTestId('hero-section');
      expect(section).toHaveAttribute(
        'aria-label',
        'Kursbild: Grundkurs Verhandlungstraining'
      );
    });
  });
});
