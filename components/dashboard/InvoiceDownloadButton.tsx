/**
 * InvoiceDownloadButton Component
 *
 * Button to download invoice PDF for completed/paid bookings.
 *
 * ## Document Streaming Architecture
 *
 * The download flow uses fetch + Blob to properly handle PDF streaming:
 *
 * 1. **Client Request**: Button click triggers `fetch()` to `/api/bookings/[id]/invoice`
 * 2. **Server Fetches PDF**: API route fetches PDF from Stripe's CDN (invoice_pdf URL)
 * 3. **Server Streams Response**: PDF binary data is returned with proper headers:
 *    - `Content-Type: application/pdf`
 *    - `Content-Disposition: attachment; filename="rechnung-{invoiceId}.pdf"`
 * 4. **Client Creates Blob**: Response is converted to Blob for download
 * 5. **Trigger Download**: Object URL created and clicked to start browser download
 *
 * ### Why fetch + Blob instead of direct link?
 *
 * - **Error Handling**: Can detect API errors (401, 404, 500) before opening tabs
 * - **No Blank Tabs**: Failed requests don't open empty browser tabs
 * - **Loading State**: Can show spinner during download preparation
 * - **User Feedback**: Can display localized error messages
 *
 * ### API Error Responses
 *
 * The API returns JSON for errors (not PDF):
 * - 400: `{ success: false, error: 'Booking not paid' }`
 * - 401: `{ success: false, error: 'Unauthorized' }`
 * - 404: `{ success: false, error: 'Booking/Invoice not found' }`
 * - 500: `{ success: false, error: 'Internal server error' }`
 *
 * @see /app/api/bookings/[bookingId]/invoice/route.ts - Server-side streaming
 * @see /lib/services/stripe-invoice.ts - Stripe invoice retrieval
 */

'use client';

import { DescriptionOutlined } from '@mui/icons-material';
import { CircularProgress, Link as MuiLink, Tooltip } from '@mui/material';
import { useCallback, useState } from 'react';
import { colors, typography } from '@/lib/design-tokens';
import { logClientError } from '@/lib/errors/client';

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
  NOT_PAID: 'Buchung noch nicht bezahlt',
  NETWORK: 'Netzwerkfehler - bitte erneut versuchen',
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
 * Maps HTTP status codes to localized error messages
 */
function getErrorMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return ERROR_MESSAGES.NOT_PAID;
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    default:
      return ERROR_MESSAGES.GENERIC;
  }
}

/**
 * Downloads invoice PDF via fetch and triggers browser download.
 *
 * Uses fetch + Blob approach to:
 * 1. Properly handle API errors without opening blank tabs
 * 2. Show loading state during download
 * 3. Provide meaningful error messages
 *
 * @param bookingId - The booking ID to download invoice for
 * @returns Promise resolving to success/error result
 */
export async function initiateInvoiceDownload(
  bookingId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const url = `/api/bookings/${bookingId}/invoice`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Include auth cookies
    });

    // Check if response is an error (API returns JSON for errors)
    if (!response.ok) {
      return {
        success: false,
        error: getErrorMessageForStatus(response.status),
      };
    }

    // Verify we got a PDF (not JSON error response)
    const contentType = response.headers.get('Content-Type');
    if (!contentType?.includes('application/pdf')) {
      return {
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      };
    }

    // Convert response to blob for download
    const blob = await response.blob();

    // Extract filename from Content-Disposition header or use default
    const disposition = response.headers.get('Content-Disposition');
    const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
    const filename = filenameMatch?.[1] || `rechnung-${bookingId}.pdf`;

    // Create object URL and trigger download
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup: Revoke the object URL after a short delay to ensure the download has started
    // This prevents a race condition where the URL is revoked before the browser initiates download
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 100);

    return { success: true };
  } catch (error) {
    // Network errors (offline, CORS, etc.)
    return {
      success: false,
      error:
        error instanceof TypeError
          ? ERROR_MESSAGES.NETWORK
          : ERROR_MESSAGES.GENERIC,
    };
  }
}

export default function InvoiceDownloadButton({
  bookingId,
  disabled = false,
  onError,
  compact = false,
}: InvoiceDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (disabled || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await initiateInvoiceDownload(bookingId);

      if (!result.success) {
        const invoiceError = new Error(result.error);
        logClientError(invoiceError, {
          component: 'InvoiceDownloadButton',
          bookingId,
          action: 'handleClick',
        });
        setError(result.error);
        onError?.(invoiceError);
      }
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
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, disabled, isLoading, onError]);

  const buttonDisabled = disabled || isLoading;
  const buttonText = isLoading
    ? BUTTON_TEXT.LOADING
    : error
      ? BUTTON_TEXT.ERROR
      : BUTTON_TEXT.DEFAULT;

  const link = (
    <MuiLink
      component='button'
      type='button'
      underline='hover'
      onClick={handleClick}
      disabled={buttonDisabled}
      aria-label={buttonText}
      aria-busy={isLoading}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        color: error ? '#d32f2f' : colors.marsala,
        fontFamily: typography.body,
        fontWeight: 500,
        fontSize: '0.875rem',
        cursor: buttonDisabled ? 'not-allowed' : 'pointer',
        opacity: buttonDisabled ? 0.5 : 1,
        border: 'none',
        background: 'none',
        p: 0,
        '&:hover': {
          color: colors.bronze,
        },
        '&:focus-visible': {
          outline: `2px solid ${colors.bronze}`,
          outlineOffset: 2,
        },
      }}
      data-testid={`invoice-download-${bookingId}`}
    >
      {isLoading ? (
        <CircularProgress size={14} color='inherit' />
      ) : (
        <DescriptionOutlined sx={{ fontSize: '1rem' }} />
      )}
      {compact ? null : buttonText}
    </MuiLink>
  );

  // Show tooltip on error
  if (error) {
    return (
      <Tooltip title={error} arrow>
        {link}
      </Tooltip>
    );
  }

  return link;
}
