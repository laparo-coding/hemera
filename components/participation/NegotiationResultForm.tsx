'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { deDE as pickersDeDE } from '@mui/x-date-pickers/locales';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { colors, typography } from '@/lib/design-tokens';
import type { NegotiationPartner } from '@/lib/types/participation';

const PARTNER_OPTIONS: { key: NegotiationPartner; label: string }[] = [
  { key: 'DIRECT_MANAGER', label: 'Mit meiner Führungskraft' },
  {
    key: 'SKIP_LEVEL_MANAGER',
    label: 'Mit der Führungskraft meiner Führungskraft',
  },
  { key: 'HR_DEPARTMENT', label: 'Mit der Personalabteilung' },
];

function getTabIndex(
  selectedPartner: NegotiationPartner | null,
  optionKey: NegotiationPartner,
  optionIndex: number
): 0 | -1 {
  if (selectedPartner) {
    return selectedPartner === optionKey ? 0 : -1;
  }

  return optionIndex === 0 ? 0 : -1;
}

export interface NegotiationResultFormProps {
  bookingId: string;
  initialValues?: {
    resultDate: Date | null;
    resultNegotiationPartner: NegotiationPartner | null;
    resultOutcome: string | null;
  };
  saveAction: (params: {
    bookingId: string;
    resultDate?: string | null;
    resultNegotiationPartner?: string | null;
    resultOutcome?: string | null;
  }) => Promise<{
    success: boolean;
    error?: { code?: string; message: string };
  }>;
}

export default function NegotiationResultForm({
  bookingId,
  initialValues,
  saveAction,
}: NegotiationResultFormProps) {
  const [resultDate, setResultDate] = useState<Date | null>(
    initialValues?.resultDate ?? null
  );
  const [selectedPartner, setSelectedPartner] =
    useState<NegotiationPartner | null>(
      initialValues?.resultNegotiationPartner ?? null
    );
  const [resultOutcome, setResultOutcome] = useState(
    initialValues?.resultOutcome ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const partnerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await saveAction({
        bookingId,
        resultDate: resultDate ? format(resultDate, 'yyyy-MM-dd') : null,
        resultNegotiationPartner: selectedPartner,
        resultOutcome: resultOutcome || null,
      });
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error?.message ?? 'Ein Fehler ist aufgetreten');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: '16px',
          border: `1px solid ${colors.tealAlpha10}`,
          bgcolor: colors.white,
        }}
      >
        <Stack spacing={4}>
          {/* Date Picker */}
          <Box>
            <Typography
              sx={{
                fontFamily: typography.body,
                fontWeight: 600,
                fontSize: '1rem',
                color: colors.lightBlack,
                mb: 2,
              }}
            >
              Wann hast du dein Gehaltsgespräch geführt?
            </Typography>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={de}
              localeText={
                pickersDeDE.components.MuiLocalizationProvider.defaultProps
                  .localeText
              }
            >
              <StaticDatePicker
                value={resultDate}
                onChange={(date: Date | null) => {
                  setSuccess(false);
                  setResultDate(date);
                }}
                disableFuture
                slotProps={{
                  actionBar: { actions: [] },
                }}
              />
            </LocalizationProvider>
          </Box>

          {/* Partner Selector */}
          <Box>
            <Typography
              sx={{
                fontFamily: typography.body,
                fontWeight: 600,
                fontSize: '1rem',
                color: colors.lightBlack,
                mb: 2,
              }}
            >
              Mit wem hast du verhandelt?
            </Typography>
            <Stack
              role='radiogroup'
              aria-label='Mit wem hast du verhandelt?'
              spacing={1.5}
            >
              {PARTNER_OPTIONS.map((option, optionIndex) => (
                <Paper
                  key={option.key}
                  ref={(el: HTMLDivElement | null) => {
                    partnerRefs.current[optionIndex] = el;
                  }}
                  role='radio'
                  aria-checked={selectedPartner === option.key}
                  aria-label={option.label}
                  tabIndex={getTabIndex(
                    selectedPartner,
                    option.key,
                    optionIndex
                  )}
                  onClick={() => {
                    setSuccess(false);
                    setSelectedPartner(option.key);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSuccess(false);
                      setSelectedPartner(option.key);
                    } else if (
                      e.key === 'ArrowDown' ||
                      e.key === 'ArrowRight'
                    ) {
                      e.preventDefault();
                      const nextIdx =
                        (optionIndex + 1) % PARTNER_OPTIONS.length;
                      const next = PARTNER_OPTIONS[nextIdx];
                      if (next) {
                        setSuccess(false);
                        setSelectedPartner(next.key);
                      }
                      partnerRefs.current[nextIdx]?.focus();
                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      const prevIdx =
                        (optionIndex - 1 + PARTNER_OPTIONS.length) %
                        PARTNER_OPTIONS.length;
                      const prev = PARTNER_OPTIONS[prevIdx];
                      if (prev) {
                        setSuccess(false);
                        setSelectedPartner(prev.key);
                      }
                      partnerRefs.current[prevIdx]?.focus();
                    }
                  }}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    border:
                      selectedPartner === option.key
                        ? `2px solid ${colors.marsala}`
                        : `1px solid ${colors.tealAlpha10}`,
                    bgcolor:
                      selectedPartner === option.key
                        ? colors.beige
                        : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: colors.marsala,
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${colors.marsala}`,
                      outlineOffset: '2px',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: typography.body,
                      fontSize: '0.875rem',
                      fontWeight: selectedPartner === option.key ? 600 : 400,
                      color: colors.lightBlack,
                    }}
                  >
                    {option.label}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Box>

          {/* Outcome Textarea */}
          <Box>
            <Typography
              sx={{
                fontFamily: typography.body,
                fontWeight: 600,
                fontSize: '1rem',
                color: colors.lightBlack,
                mb: 2,
              }}
            >
              Was war das Verhandlungsergebnis?
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              value={resultOutcome}
              onChange={e => {
                setSuccess(false);
                setResultOutcome(e.target.value);
              }}
              slotProps={{
                htmlInput: {
                  maxLength: 2000,
                  'aria-label': 'Verhandlungsergebnis',
                },
              }}
              placeholder='Beschreibe das Ergebnis deines Gehaltsgesprächs...'
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: typography.body,
                  fontSize: '0.875rem',
                  backgroundColor: colors.lightGray,
                  border: 'none',
                  '& fieldset': {
                    border: 'none',
                  },
                },
              }}
            />
          </Box>

          {error && <Alert severity='error'>{error}</Alert>}
          {success && (
            <Alert severity='success'>Verhandlungsergebnis gespeichert!</Alert>
          )}

          {/* Submit Button */}
          <Button
            variant='contained'
            onClick={handleSubmit}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={18} aria-label='Wird gespeichert' />
              ) : undefined
            }
            sx={{
              fontFamily: typography.body,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: colors.marsala,
              '&:hover': {
                bgcolor: colors.marsalaDark,
              },
              alignSelf: 'flex-start',
            }}
          >
            Verhandlungsergebnis speichern
          </Button>

          {/* Back to Dashboard */}
          <Button
            component={Link}
            href='/dashboard'
            sx={{
              fontFamily: typography.body,
              textTransform: 'none',
              color: colors.marsala,
              alignSelf: 'flex-start',
              '&:hover': {
                bgcolor: 'transparent',
                textDecoration: 'underline',
              },
            }}
          >
            Zurück zum Dashboard
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
