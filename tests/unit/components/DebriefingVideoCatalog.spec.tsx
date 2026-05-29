/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';

// Mock MuxPlayer dynamic import
vi.mock('next/dynamic', () => {
  return {
    default: () => {
      const MockMuxPlayer = (
        props: { playbackId?: string }
      ) => (
        <div data-testid="mux-player" data-playback-id={props.playbackId} />
      );
      MockMuxPlayer.displayName = 'MockMuxPlayer';
      return MockMuxPlayer;
    },
  };
});

import DebriefingVideoCatalog from '../../../components/participation/DebriefingVideoCatalog';

const mockAssets = [
  {
    id: 'asset-1',
    muxPlaybackId: 'playback-1',
    muxAssetId: 'mux-1',
    title: 'Einführung',
    description: 'Kurseinführung',
    sortOrder: 1,
    source: 'ADMIN_UPLOADED' as const,
  },
  {
    id: 'asset-2',
    muxPlaybackId: 'playback-2',
    muxAssetId: 'mux-2',
    title: 'Zusammenfassung',
    description: null,
    sortOrder: 2,
    source: 'ADMIN_UPLOADED' as const,
  },
];

describe('DebriefingVideoCatalog', () => {
  it('renders grid with correct number of video cards', () => {
    render(
      <DebriefingVideoCatalog assets={mockAssets} courseTitle="Verhandlungstraining" />
    );
    const players = screen.getAllByTestId('mux-player');
    expect(players).toHaveLength(2);
  });

  it('forwards playbackId to each MuxPlayer', () => {
    render(
      <DebriefingVideoCatalog assets={mockAssets} courseTitle="Verhandlungstraining" />
    );
    const players = screen.getAllByTestId('mux-player');
    const playbackIds = players.map(player => player.getAttribute('data-playback-id'));
    expect(playbackIds).toEqual(['playback-1', 'playback-2']);
  });

  it('renders course title as subtitle', () => {
    render(
      <DebriefingVideoCatalog assets={mockAssets} courseTitle="Verhandlungstraining" />
    );
    expect(screen.getByText('Verhandlungstraining')).toBeInTheDocument();
  });

  it('renders back link pointing to /dashboard', () => {
    render(
      <DebriefingVideoCatalog assets={mockAssets} courseTitle="Verhandlungstraining" />
    );
    const link = screen.getByRole('link', { name: /zurück zum dashboard/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('each card shows title', () => {
    render(
      <DebriefingVideoCatalog assets={mockAssets} courseTitle="Verhandlungstraining" />
    );
    expect(screen.getByText('Einführung')).toBeInTheDocument();
    expect(screen.getByText('Zusammenfassung')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    render(
      <DebriefingVideoCatalog assets={mockAssets} courseTitle="Verhandlungstraining" />
    );
    expect(screen.getByText('Kurseinführung')).toBeInTheDocument();
  });

  it('empty assets array shows fallback message', () => {
    render(
      <DebriefingVideoCatalog assets={[]} courseTitle="Verhandlungstraining" />
    );
    expect(
      screen.getByText('Deine Videos werden nach dem Seminar hier bereitgestellt.')
    ).toBeInTheDocument();
  });

  it('does not render literal "null" for missing description', () => {
    render(
      <DebriefingVideoCatalog assets={mockAssets} courseTitle="Verhandlungstraining" />
    );
    // Asset 2 has description: null — ensure the string "null" is not rendered
    const nullTexts = screen.queryAllByText('null');
    expect(nullTexts).toHaveLength(0);
  });
});
