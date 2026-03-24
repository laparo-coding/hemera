'use client';

/**
 * MaterialTypeSelector Component
 *
 * Two-card selection for choosing between CONTENT and SLIDE_CONTROL material types.
 * Responsive grid: side-by-side on desktop, stacked on mobile.
 * Keyboard accessible with focus/hover states using design tokens.
 */

import { EditNoteOutlined, UploadFileOutlined } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from '@mui/material';
import { colors } from '@/lib/design-tokens';
import type { MaterialType } from '@/lib/schemas/admin/course-material';

interface MaterialTypeSelectorProps {
  onSelect: (type: MaterialType) => void;
}

const typeOptions: {
  type: MaterialType;
  icon: React.ReactNode;
  label: string;
}[] = [
  {
    type: 'CONTENT',
    icon: <EditNoteOutlined sx={{ fontSize: 48, color: colors.bronze }} />,
    label: 'Ich möchte eine Inhaltsseite anlegen.',
  },
  {
    type: 'SLIDE_CONTROL',
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
      {typeOptions.map(({ type, icon, label }) => (
        <Card
          key={type}
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
          }}
        >
          <CardActionArea
            onClick={() => onSelect(type)}
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
