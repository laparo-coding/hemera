import { Box, Container, Grid, Typography } from '@mui/material';
import type { Metadata } from 'next';
import { colors } from '@/lib/design-tokens';

export const metadata: Metadata = {
  title: 'Design Tokens – Hemera',
  robots: { index: false, follow: false },
};

const colorEntries = Object.entries(colors) as [string, string][];

function normalizeHex(hex: string): string {
  // Expand short hex (#RGB → #RRGGBB, #RGBA → #RRGGBBAA)
  if (hex.length === 4 || hex.length === 5) {
    return `#${[...hex.slice(1)].map(c => c + c).join('')}`;
  }
  return hex;
}

/** Convert any color value (hex, #RGB, rgba()) to a full hex string */
function toHex(value: string): string {
  if (value.startsWith('#')) {
    return normalizeHex(value).toUpperCase();
  }
  // Parse rgba(r, g, b, a) or rgb(r, g, b)
  const match = value.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (match) {
    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    const a = match[4] !== undefined ? Number.parseFloat(match[4]) : 1;
    const hex = `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`;
    if (a < 1) {
      const alphaHex = Math.round(a * 255)
        .toString(16)
        .padStart(2, '0');
      return `${hex}${alphaHex}`.toUpperCase();
    }
    return hex.toUpperCase();
  }
  return value;
}

function contrastColor(value: string): string {
  const hex = toHex(value);
  if (!hex.startsWith('#') || hex.length < 7) {
    return '#2D2D2D';
  }
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  // For semi-transparent colors, blend with white background
  let alpha = 1;
  if (hex.length === 9) {
    alpha = Number.parseInt(hex.slice(7, 9), 16) / 255;
  }
  const blendedR = Math.round(r * alpha + 255 * (1 - alpha));
  const blendedG = Math.round(g * alpha + 255 * (1 - alpha));
  const blendedB = Math.round(b * alpha + 255 * (1 - alpha));
  const luminance =
    (0.299 * blendedR + 0.587 * blendedG + 0.114 * blendedB) / 255;
  return luminance > 0.5 ? '#2D2D2D' : '#FFFFFF';
}

export default function DesignPage() {
  return (
    <Container maxWidth='md' sx={{ py: 8 }}>
      <Typography variant='h3' component='h1' gutterBottom>
        Hemera Design Tokens
      </Typography>
      <Typography variant='body1' sx={{ mb: 6, opacity: 0.8 }}>
        Alle Farben aus <code>lib/design-tokens.ts</code>
      </Typography>

      <Grid container spacing={3}>
        {colorEntries.map(([name, value]) => {
          const hex = toHex(value);
          return (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={name}>
              <Box
                sx={{
                  bgcolor: value,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      color: contrastColor(value),
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    {hex}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'background.paper', px: 2, py: 1.5 }}>
                  <Typography variant='subtitle2'>{name}</Typography>
                  <Typography
                    variant='caption'
                    sx={{ opacity: 0.6, fontFamily: 'monospace' }}
                  >
                    colors.{name}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
