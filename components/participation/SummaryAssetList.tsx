/**
 * Summary Asset List Component
 *
 * Renders Mux video players for course summary assets.
 * Handles both course default assets and booking-specific overrides.
 * Shows graceful fallback when no assets are available.
 */

'use client';

import { PlayCircleOutlined, VideocamOffOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Skeleton,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  getSummaryAssetsAction,
  markSummaryViewedAction,
} from '../../lib/actions/participation';
import type { ResolvedSummaryAsset } from '../../lib/db/courseParticipation';

// Dynamically import MuxPlayer to avoid SSR issues
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <Skeleton
        variant='rectangular'
        width='100%'
        height={400}
        sx={{ borderRadius: 1 }}
      />
    ),
  }
);

// Design tokens
const colors = {
  cream: '#FBF5DD',
  petrol: '#16404D',
  gold: '#DDA853',
  sage: '#A6CDC6',
  white: '#FFFFFF',
} as const;

interface SummaryAssetListProps {
  bookingId: string;
  onAssetViewed?: (assetId: string) => void;
  onAllAssetsViewed?: () => void;
}

export const SummaryAssetList: React.FC<SummaryAssetListProps> = ({
  bookingId,
  onAssetViewed,
  onAllAssetsViewed,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<ResolvedSummaryAsset[]>([]);
  const [viewedAssets, setViewedAssets] = useState<Set<string>>(new Set());
  const [hasMarkedViewed, setHasMarkedViewed] = useState(false);

  // Load assets
  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSummaryAssetsAction(bookingId);
      if (result.success && result.data) {
        setAssets(result.data);
      } else {
        setError(result.error?.message || 'Fehler beim Laden der Videos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Mark as viewed when first asset starts playing
  const handleAssetPlay = useCallback(
    async (assetId: string) => {
      // Mark the first view in the backend
      if (!hasMarkedViewed) {
        try {
          await markSummaryViewedAction(bookingId);
          setHasMarkedViewed(true);
        } catch {
          // Non-critical, continue
        }
      }

      // Track viewed assets
      setViewedAssets(prev => {
        const next = new Set(prev);
        next.add(assetId);
        return next;
      });

      onAssetViewed?.(assetId);
    },
    [bookingId, hasMarkedViewed, onAssetViewed]
  );

  // Check if all assets have been viewed
  useEffect(() => {
    if (
      assets.length > 0 &&
      viewedAssets.size === assets.length &&
      onAllAssetsViewed
    ) {
      onAllAssetsViewed();
    }
  }, [assets.length, viewedAssets.size, onAllAssetsViewed]);

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' py={4}>
        <CircularProgress sx={{ color: colors.petrol }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (assets.length === 0) {
    return (
      <Card
        elevation={0}
        sx={{
          border: `1px dashed ${colors.sage}`,
          backgroundColor: colors.cream,
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <VideocamOffOutlined
            sx={{ fontSize: 48, color: colors.sage, mb: 2 }}
          />
          <Typography variant='h6' sx={{ color: colors.petrol, mb: 1 }}>
            Keine Zusammenfassungsvideos verfügbar
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Für diesen Kurs sind derzeit keine Video-Zusammenfassungen
            hinterlegt. Sie können diesen Schritt überspringen.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {assets.map((asset, index) => (
        <SummaryAssetCard
          key={asset.id}
          asset={asset}
          index={index}
          isViewed={viewedAssets.has(asset.id)}
          onPlay={() => handleAssetPlay(asset.id)}
        />
      ))}

      {viewedAssets.size === assets.length && (
        <Alert severity='success' sx={{ mt: 2 }}>
          ✓ Du hast alle Zusammenfassungsvideos angesehen.
        </Alert>
      )}
    </Box>
  );
};

// Individual asset card with Mux player
interface SummaryAssetCardProps {
  asset: ResolvedSummaryAsset;
  index: number;
  isViewed: boolean;
  onPlay: () => void;
}

const SummaryAssetCard: React.FC<SummaryAssetCardProps> = ({
  asset,
  index,
  isViewed,
  onPlay,
}) => {
  const [hasStarted, setHasStarted] = useState(false);

  const handlePlay = () => {
    if (!hasStarted) {
      setHasStarted(true);
      onPlay();
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${isViewed ? colors.sage : colors.petrol}`,
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'border-color 0.3s ease',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.5,
          backgroundColor: isViewed ? 'rgba(166, 205, 198, 0.1)' : colors.cream,
          borderBottom: `1px solid ${colors.sage}`,
        }}
      >
        <PlayCircleOutlined
          sx={{ color: isViewed ? colors.sage : colors.petrol }}
        />
        <Typography
          variant='subtitle1'
          sx={{ fontWeight: 500, color: colors.petrol }}
        >
          {index + 1}. {asset.title}
        </Typography>
        {isViewed && (
          <Typography variant='caption' sx={{ ml: 'auto', color: colors.sage }}>
            ✓ Angesehen
          </Typography>
        )}
      </Box>

      <Box sx={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
        <MuxPlayer
          playbackId={asset.muxPlaybackId}
          metadata={{
            video_title: asset.title,
            viewer_user_id: 'participant',
          }}
          accentColor={colors.gold}
          onPlay={handlePlay}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>

      {asset.description && (
        <CardContent>
          <Typography variant='body2' color='text.secondary'>
            {asset.description}
          </Typography>
        </CardContent>
      )}
    </Card>
  );
};

export default SummaryAssetList;
