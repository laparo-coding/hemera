'use client';

import { ArrowBack } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { ResolvedSummaryAsset } from '@/lib/db/courseParticipation';
import { colors, typography } from '@/lib/design-tokens';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress size={32} />
    </Box>
  ),
});

interface DebriefingVideoCatalogProps {
  assets: ResolvedSummaryAsset[];
  courseTitle: string;
}

export default function DebriefingVideoCatalog({
  assets,
  courseTitle,
}: DebriefingVideoCatalogProps) {
  const playableAssets = assets.filter(
    (asset): asset is ResolvedSummaryAsset & { muxPlaybackId: string } =>
      asset.muxPlaybackId != null
  );

  if (playableAssets.length === 0) {
    return (
      <Box>
        <Typography
          sx={{
            fontFamily: typography.body,
            fontSize: '0.875rem',
            color: colors.lightBlack,
            opacity: 0.7,
            mb: 2,
          }}
        >
          {courseTitle}
        </Typography>
        <Alert severity='info' sx={{ mb: 3 }}>
          Deine Videos werden nach dem Seminar hier bereitgestellt.
        </Alert>
        <Button
          component={Link}
          href='/dashboard'
          startIcon={<ArrowBack />}
          sx={{
            fontFamily: typography.body,
            textTransform: 'none',
            color: colors.marsala,
          }}
        >
          Zurück zum Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        sx={{
          fontFamily: typography.body,
          fontSize: '0.875rem',
          color: colors.lightBlack,
          opacity: 0.7,
          mb: 3,
        }}
      >
        {courseTitle}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        {playableAssets.map(asset => (
          <Paper
            key={asset.id}
            elevation={0}
            sx={{
              borderRadius: '12px',
              border: `1px solid ${colors.tealAlpha10}`,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ aspectRatio: '16/9', position: 'relative' }}>
              <MuxPlayer
                playbackId={asset.muxPlaybackId}
                accentColor={colors.bronze}
                streamType='on-demand'
                defaultHiddenCaptions
                metadata={{ asset_id: asset.id, video_title: asset.title }}
                title={asset.title}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography
                sx={{
                  fontFamily: typography.body,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: colors.lightBlack,
                }}
              >
                {asset.title}
              </Typography>
              {asset.description && (
                <Typography
                  sx={{
                    fontFamily: typography.body,
                    fontSize: '0.75rem',
                    color: colors.lightBlack,
                    opacity: 0.7,
                    mt: 0.5,
                  }}
                >
                  {asset.description}
                </Typography>
              )}
            </Box>
          </Paper>
        ))}
      </Box>

      <Button
        component={Link}
        href='/dashboard'
        startIcon={<ArrowBack />}
        sx={{
          fontFamily: typography.body,
          textTransform: 'none',
          color: colors.marsala,
        }}
      >
        Zurück zum Dashboard
      </Button>
    </Box>
  );
}
