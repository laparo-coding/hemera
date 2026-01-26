/**
 * InvoiceDownloadButton Component
 *
 * Button to download invoice PDF for completed/paid bookings.
 * Opens invoice in a new tab for download.
 */

'use client';

import { DownloadOutlined } from '@mui/icons-material';
import { Button, Tooltip } from '@mui/material';
import { useCallback, useState } from 'react';

import { logClientError } from '@/lib/errors/client';

// Design tokens
const colors = {
  petrol: '#16404D',
  gold: '#DDA853',
};

// Button text localization (German)
export const BUTTON_TEXT = {
  DEFAULT: 'Rechnung herunterladen',
  LOADING: 'Wird geladen...',
  ERROR: 'Fehler beim Laden',
} as const;

// Error messages (German)
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Nicht autorisiert',
  FORBIDDEN: 'Zugriff verweigert',
  NOT_FOUND: 'Rechnung nicht verfügbar',
  GENERIC: 'Ein Fehler ist aufgetreten',
} as const;

interface InvoiceDownloadButtonProps {
  /** The booking ID to fetch invoice for */
  bookingId: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * Triggers invoice download by creating a temporary link.
 * The API streams the PDF directly with Content-Disposition: attachment,
 * so no new tab is opened - the download starts immediately.
 */
export const initiateInvoiceDownload = (bookingId: string): void => {
  // Create a temporary link element and trigger a click
  // The API returns the PDF with attachment disposition, triggering direct download
  const link = document.createElement('a');
  link.href = `/api/bookings/${bookingId}/invoice`;
  // No target="_blank" - the browser will handle the download in the background
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function InvoiceDownloadButton({
  bookingId,
  disabled = false,
  onError,
  compact = false,
}: InvoiceDownloadButtonProps) {
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    if (disabled) return;

    setError(null);

    try {
      initiateInvoiceDownload(bookingId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC;
      const invoiceError = new Error(errorMessage);
      logClientError(invoiceError, {
        component: 'InvoiceDownloadButton',
        bookingId,
        action: 'handleClick',
      });
      setError(errorMessage);
      onError?.(invoiceError);
    }
  }, [bookingId, disabled, onError]);

  const buttonDisabled = disabled;
  const buttonText = error ? BUTTON_TEXT.ERROR : BUTTON_TEXT.DEFAULT;

  const button = (
    <Button
      variant='outlined'
      size='small'
      onClick={handleClick}
      disabled={buttonDisabled}
      startIcon={<DownloadOutlined />}
      aria-label={BUTTON_TEXT.DEFAULT}
      sx={{
        borderColor: error ? '#d32f2f' : colors.petrol,
        color: error ? '#d32f2f' : colors.petrol,
        fontFamily: '"Inter", sans-serif',
        fontWeight: 500,
        textTransform: 'none',
        minWidth: compact ? 'auto' : undefined,
        px: compact ? 1.5 : 2,
        '&:hover': {
          borderColor: colors.gold,
          backgroundColor: 'rgba(221, 168, 83, 0.1)',
        },
        '&.Mui-disabled': {
          borderColor: 'rgba(22, 64, 77, 0.3)',
          color: 'rgba(22, 64, 77, 0.5)',
        },
      }}
      data-testid={`invoice-download-${bookingId}`}
    >
      {compact ? null : buttonText}
    </Button>
  );

  // Show tooltip on error
  if (error) {
    return (
      <Tooltip title={error} arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
}
