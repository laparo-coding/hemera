/**
 * MaterialTypeSelector Component
 *
 * Selection screen for choosing material creation mode.
 * Feature 030: Extended with 3rd tile for HTML content file upload.
 *
 * Three-card selection in 2-1 grid layout:
 * - Row 1: "Inhaltsseite hinzufügen" (CONTENT upload) | "Inhaltsseite anlegen" (CONTENT editor)
 * - Row 2: "Steuerdatei hinzufügen" (SLIDE_CONTROL upload)
 *
 * Responsive: side-by-side on desktop, stacked on mobile.
 * Keyboard accessible with focus/hover states using design tokens.
 */

'use client';

import { EditNoteOutlined, UploadFileOutlined } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from '@mui/material';
import { colors } from '@/lib/design-tokens';
import type { MaterialCreationMode } from '@/lib/types/course-material';

export type { MaterialCreationMode };

interface MaterialTypeSelectorProps {
  onSelect: (mode: MaterialCreationMode) => void;
}

const typeOptions: {
  mode: MaterialCreationMode;
  icon: React.ReactNode;
  label: string;
}[] = [
  {
    mode: 'CONTENT_UPLOAD',
    icon: <UploadFileOutlined sx={{ fontSize: 48, color: colors.bronze }} />,
    label: 'Ich möchte eine Inhaltsseite hinzufügen.',
  },
  {
    mode: 'CONTENT_EDITOR',
    icon: <EditNoteOutlined sx={{ fontSize: 48, color: colors.bronze }} />,
    label: 'Ich möchte eine Inhaltsseite anlegen.',
  },
  {
    mode: 'SLIDE_CONTROL',
    icon: <UploadFileOutlined sx={{ fontSize: 48, color: colors.bronze }} />,
    label: 'Ich möchte eine Steuerdatei hinzufügen.',
  },
];

export default function MaterialTypeSelector({
  onSelect,
}: MaterialTypeSelectorProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 3,
        maxWidth: 700,
        mx: 'auto',
        mt: 4,
      }}
    >
      {typeOptions.map(({ mode, icon, label }) => (
        <Card
          key={mode}
          variant='outlined'
          sx={{
            transition:
              'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
            '&:hover': {
              borderColor: colors.bronze,
              backgroundColor: colors.bronzeLight,
            },
            '&:focus-within': {
              borderColor: colors.bronze,
              boxShadow: `0 0 0 2px ${colors.bronze}`,
            },
            // Third tile spans full width (2-1 layout)
            ...(mode === 'SLIDE_CONTROL' && {
              gridColumn: { xs: '1', sm: '1 / -1' },
              maxWidth: { sm: 'calc(50% - 12px)' },
              mx: { sm: 'auto' },
            }),
          }}
        >
          <CardActionArea
            onClick={() => onSelect(mode)}
            aria-label={label}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              minHeight: 180,
              '&:focus-visible': {
                outline: `2px solid ${colors.bronze}`,
                outlineOffset: 2,
              },
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                textAlign: 'center',
                p: 0,
                '&:last-child': { pb: 0 },
              }}
            >
              {icon}
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {label}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
