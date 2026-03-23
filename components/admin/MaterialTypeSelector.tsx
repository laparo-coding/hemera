'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import type { MaterialType } from '@/lib/schemas/admin/course-material';

interface MaterialTypeSelectorProps {
  onSelect: (type: MaterialType) => void;
}

export default function MaterialTypeSelector({
  onSelect,
}: MaterialTypeSelectorProps) {
  return (
    <Stack spacing={2} sx={{ maxWidth: 400, mx: 'auto' }}>
      <Button
        variant='outlined'
        size='large'
        onClick={() => onSelect('CONTENT')}
        sx={{ py: 2, textAlign: 'left', justifyContent: 'flex-start' }}
      >
        <Box>
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
            Inhaltsseite
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            HTML-Inhalt mit Text und Medien
          </Typography>
        </Box>
      </Button>

      <Button
        variant='outlined'
        size='large'
        onClick={() => onSelect('SLIDE_CONTROL')}
        sx={{ py: 2, textAlign: 'left', justifyContent: 'flex-start' }}
      >
        <Box>
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
            Foliensteuerelement
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Hochladen und Steuern von Präsentationen
          </Typography>
        </Box>
      </Button>
    </Stack>
  );
}
