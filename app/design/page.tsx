import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import type { Metadata } from 'next';
import {
  type CourseLevelColorEntries,
  colors,
  courseLevelColors,
  fontWeights,
  shadows,
  typography,
} from '@/lib/design-tokens';

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

      {/* ── Beispiel-Elemente ─────────────────────────────────── */}
      <Divider sx={{ my: 8 }} />
      <Typography variant='h4' component='h2' gutterBottom>
        UI-Beispiele
      </Typography>
      <Typography variant='body1' sx={{ mb: 4, opacity: 0.8 }}>
        So werden die Design Tokens in der Praxis eingesetzt.
      </Typography>

      {/* Buttons */}
      <Typography variant='h5' component='h3' sx={{ mb: 2 }}>
        Buttons
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Button
          sx={{
            bgcolor: colors.marsala,
            color: colors.white,
            fontFamily: typography.body,
            fontWeight: fontWeights.semibold,
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': { bgcolor: colors.marsalaDark },
          }}
        >
          Jetzt buchen
        </Button>
        <Button
          sx={{
            bgcolor: colors.bronze,
            color: colors.white,
            fontFamily: typography.body,
            fontWeight: fontWeights.semibold,
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': { bgcolor: colors.bronzeHover },
          }}
        >
          Kurs entdecken
        </Button>
        <Button
          variant='outlined'
          sx={{
            borderColor: colors.marsala,
            color: colors.marsala,
            fontFamily: typography.body,
            fontWeight: fontWeights.medium,
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              bgcolor: colors.sageLight,
              borderColor: colors.marsalaDark,
            },
          }}
        >
          Mehr erfahren
        </Button>
        <Button
          disabled
          sx={{
            bgcolor: colors.lightGray,
            color: colors.lightBlack,
            fontFamily: typography.body,
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            opacity: 0.5,
          }}
        >
          Ausgebucht
        </Button>
      </Box>

      {/* Chips / Level-Badges */}
      <Typography variant='h5' component='h3' sx={{ mb: 2 }}>
        Kurs-Level Chips
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 4 }}>
        {(Object.entries(courseLevelColors) as CourseLevelColorEntries).map(
          ([level, { bg, text, label }]) => (
            <Chip
              key={level}
              label={`${label} – ${level.charAt(0) + level.slice(1).toLowerCase()}`}
              sx={{
                bgcolor: bg,
                color: text,
                fontFamily: typography.body,
                fontWeight: fontWeights.semibold,
                fontSize: '0.875rem',
                px: 1,
              }}
            />
          )
        )}
      </Box>

      {/* Status Chips */}
      <Typography variant='h5' component='h3' sx={{ mb: 2 }}>
        Status &amp; Info Chips
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 4 }}>
        <Chip
          label='Bestätigt'
          sx={{
            bgcolor: colors.success,
            color: colors.white,
            fontWeight: fontWeights.medium,
          }}
        />
        <Chip
          label='Warnung'
          sx={{
            bgcolor: colors.warning,
            color: colors.white,
            fontWeight: fontWeights.medium,
          }}
        />
        <Chip
          label='Information'
          sx={{
            bgcolor: colors.infoMain,
            color: colors.white,
            fontWeight: fontWeights.medium,
          }}
        />
        <Chip
          label='2 Plätze frei'
          sx={{
            bgcolor: colors.tealAlpha10,
            color: colors.teal,
            fontWeight: fontWeights.medium,
            border: `1px solid ${colors.tealAlpha10}`,
          }}
        />
        <Chip
          label='Rosy Akzent'
          sx={{
            bgcolor: colors.rosyPink,
            color: colors.marsala,
            fontWeight: fontWeights.medium,
          }}
        />
      </Box>

      {/* Karten */}
      <Typography variant='h5' component='h3' sx={{ mb: 2 }}>
        Karten
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${colors.tealAlpha10}`,
              boxShadow: shadows.card,
              borderRadius: 3,
              overflow: 'hidden',
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: shadows.cardHover },
            }}
          >
            <Box
              sx={{
                bgcolor: colors.beige,
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                sx={{
                  fontFamily: typography.heading,
                  fontSize: '1.5rem',
                  color: colors.marsala,
                }}
              >
                Kurs-Vorschau
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Typography
                sx={{
                  fontFamily: typography.heading,
                  fontWeight: fontWeights.bold,
                  color: colors.lightBlack,
                  mb: 1,
                }}
              >
                Gehaltsgespräch meistern
              </Typography>
              <Typography
                sx={{
                  fontFamily: typography.body,
                  color: colors.lightBlack,
                  opacity: 0.7,
                  fontSize: '0.875rem',
                  mb: 2,
                }}
              >
                Lerne, wie du selbstbewusst und strukturiert in dein nächstes
                Gehaltsgespräch gehst.
              </Typography>
              <Chip
                label='A – Beginner'
                size='small'
                sx={{
                  bgcolor: courseLevelColors.BEGINNER.bg,
                  color: courseLevelColors.BEGINNER.text,
                  fontWeight: fontWeights.semibold,
                }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: colors.tealAlpha4,
              border: `1px solid ${colors.tealAlpha10}`,
              borderRadius: 3,
              p: 3,
              boxShadow: shadows.card,
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: shadows.cardHover },
            }}
          >
            <Typography
              sx={{
                fontFamily: typography.heading,
                fontWeight: fontWeights.bold,
                color: colors.teal,
                mb: 1,
              }}
            >
              Buchungsübersicht
            </Typography>
            <Typography
              sx={{
                fontFamily: typography.body,
                color: colors.lightBlack,
                fontSize: '0.875rem',
                mb: 2,
              }}
            >
              Deine nächste Buchung: 15. April 2026 – München
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label='Bestätigt'
                size='small'
                sx={{ bgcolor: colors.success, color: colors.white }}
              />
              <Chip
                label='Präsenz'
                size='small'
                sx={{ bgcolor: colors.infoMain, color: colors.white }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Typografie */}
      <Typography variant='h5' component='h3' sx={{ mb: 2 }}>
        Typografie
      </Typography>
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${colors.lightGray}`,
          borderRadius: 3,
          p: 4,
          mb: 4,
        }}
      >
        <Typography
          sx={{
            fontFamily: typography.heading,
            fontWeight: fontWeights.bold,
            fontSize: '2rem',
            color: colors.marsala,
            mb: 1,
          }}
        >
          Heading – Playfair Display
        </Typography>
        <Typography
          sx={{
            fontFamily: typography.heading,
            fontWeight: fontWeights.semibold,
            fontSize: '1.5rem',
            color: colors.marsala,
            mb: 1,
          }}
        >
          Subheading – Playfair Display Semibold
        </Typography>
        <Typography
          sx={{
            fontFamily: typography.body,
            fontWeight: fontWeights.regular,
            fontSize: '1rem',
            color: colors.lightBlack,
            mb: 1,
          }}
        >
          Body Text – Inter Regular. So sieht der Fließtext auf der Hemera-Seite
          aus.
        </Typography>
        <Typography
          sx={{
            fontFamily: typography.body,
            fontWeight: fontWeights.semibold,
            fontSize: '0.875rem',
            color: colors.bronze,
          }}
        >
          Label / CTA – Inter Semibold
        </Typography>
      </Paper>

      {/* Schatten & Overlays */}
      <Typography variant='h5' component='h3' sx={{ mb: 2 }}>
        Schatten &amp; Hintergründe
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box
            sx={{
              bgcolor: colors.white,
              boxShadow: shadows.card,
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>
              shadows.card
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box
            sx={{
              bgcolor: colors.white,
              boxShadow: shadows.cardHover,
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>
              shadows.cardHover
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box
            sx={{
              bgcolor: colors.sageLight,
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>
              sageLight
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box
            sx={{
              bgcolor: colors.bronzeLight,
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>
              bronzeLight
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Overlay auf dunklem Hintergrund */}
      <Typography variant='h5' component='h3' sx={{ mb: 2 }}>
        Dark Overlay / Hero
      </Typography>
      <Box
        sx={{
          bgcolor: colors.teal,
          borderRadius: 3,
          p: 6,
          mb: 4,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <Typography
          sx={{
            fontFamily: typography.heading,
            fontWeight: fontWeights.bold,
            fontSize: '1.75rem',
            color: colors.beige,
            mb: 1,
          }}
        >
          Hemera Academy
        </Typography>
        <Typography
          sx={{
            fontFamily: typography.body,
            color: colors.white,
            opacity: 0.85,
            mb: 3,
          }}
        >
          Entfalte dein volles Potenzial in unseren Kursen.
        </Typography>
        <Button
          sx={{
            bgcolor: colors.bronze,
            color: colors.white,
            fontFamily: typography.body,
            fontWeight: fontWeights.semibold,
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': { bgcolor: colors.bronzeHover },
          }}
        >
          Kurse entdecken
        </Button>
        <Box sx={{ mt: 2 }}>
          <Button
            sx={{
              color: colors.white,
              bgcolor: colors.whiteOverlay15,
              fontFamily: typography.body,
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { bgcolor: colors.whiteOverlay25 },
            }}
          >
            Mehr erfahren
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
