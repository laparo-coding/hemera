/**
 * GET /api/bookings/[bookingId]/invoice
 *
 * Downloads the Stripe invoice PDF for a specific booking.
 *
 * ## Document Streaming Flow
 *
 * ```
 * Client                    API Route                    Stripe CDN
 *   |                           |                            |
 *   |------ GET /invoice ------>|                            |
 *   |                           |------- fetch PDF --------->|
 *   |                           |<------ PDF binary ---------|
 *   |<----- PDF Response -------|                            |
 *   |   (Content-Type: pdf)     |                            |
 *   |   (Content-Disposition)   |                            |
 * ```
 *
 * ### Response Headers
 * - `Content-Type: application/pdf`
 * - `Content-Disposition: attachment; filename="rechnung-{invoiceId}.pdf"`
 * - `Content-Length: {size}`
 * - `Cache-Control: private, max-age=3600`
 *
 * ### Error Responses (JSON)
 * - 401: Unauthorized (not logged in)
 * - 404: Booking not found or invoice not available
 * - 400: Booking not paid
 * - 500: Internal server error
 *
 * ### Caching Strategy
 * The PDF URL from Stripe is cached in the database (`stripeInvoicePdfUrl`)
 * to avoid repeated Stripe API calls. URLs are fetched on-demand if not cached.
 */

import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db/prisma';
import { logError } from '../../../../../lib/errors';
import { validateInvoiceDownload } from '../../../../../lib/services/stripe-invoice';

interface RouteParams {
  params: Promise<{ bookingId: string }>;
}

/**
 * Fetches PDF from Stripe CDN and returns it as a downloadable response.
 *
 * The PDF is fetched server-side to:
 * 1. Hide Stripe URLs from client (security)
 * 2. Add proper Content-Disposition header for download
 * 3. Handle Stripe authentication transparently
 *
 * @param pdfUrl - Stripe's invoice PDF URL (e.g., https://invoice.stripe.com/...)
 * @param invoiceId - Stripe invoice ID for filename generation
 * @returns Response with PDF binary and download headers
 * @throws Error if Stripe PDF fetch fails
 */
async function streamPdfDownload(
  pdfUrl: string,
  invoiceId: string
): Promise<Response> {
  const pdfResponse = await fetch(pdfUrl);

  if (!pdfResponse.ok) {
    throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
  }

  // Generate filename from invoice ID (German: "Rechnung")
  const filename = `rechnung-${invoiceId}.pdf`;

  // Build response headers
  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'private, max-age=3600',
  });

  // Pass through Content-Length from Stripe's response if available
  const contentLength = pdfResponse.headers.get('Content-Length');
  if (contentLength) {
    headers.set('Content-Length', contentLength);
  }

  // Stream the PDF directly instead of buffering in memory
  // This reduces server memory usage for large PDFs
  return new Response(pdfResponse.body, {
    status: 200,
    headers,
  });
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const requestId = crypto.randomUUID();
  const { bookingId } = await params;

  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Find booking with user ownership check
    // Note: Prisma booking.userId matches Clerk userId directly (no sync needed)
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      select: {
        id: true,
        paymentStatus: true,
        stripeSessionId: true,
        stripeInvoiceId: true,
        stripeInvoicePdfUrl: true,
      },
    });

    // 3. Check if booking exists
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // 4. Validate invoice can be downloaded
    const validation = validateInvoiceDownload(
      booking.paymentStatus,
      booking.stripeInvoiceId
    );

    if (!validation.valid) {
      // If not paid, return 400; if no invoice, return 404
      const status = validation.error?.includes('paid') ? 400 : 404;
      return NextResponse.json(
        { success: false, error: validation.error || 'Invoice not available' },
        { status }
      );
    }

    // 5. Check if we have the PDF URL cached
    if (booking.stripeInvoicePdfUrl && booking.stripeInvoiceId) {
      return streamPdfDownload(
        booking.stripeInvoicePdfUrl,
        booking.stripeInvoiceId
      );
    }

    // 6. If no cached URL but we have invoice ID, fetch from Stripe
    if (booking.stripeInvoiceId) {
      const { getInvoicePdfUrl } = await import(
        '../../../../../lib/services/stripe-invoice'
      );
      const pdfUrl = await getInvoicePdfUrl(booking.stripeInvoiceId);

      if (pdfUrl) {
        // Cache the PDF URL for future requests
        await prisma.booking.update({
          where: { id: booking.id },
          data: { stripeInvoicePdfUrl: pdfUrl },
        });
        return streamPdfDownload(pdfUrl, booking.stripeInvoiceId);
      }
    }

    // 7. If no invoice ID but we have session ID, try to get invoice from checkout session
    if (booking.stripeSessionId) {
      const { getInvoiceFromCheckoutSession } = await import(
        '../../../../../lib/services/stripe-invoice'
      );
      const invoiceData = await getInvoiceFromCheckoutSession(
        booking.stripeSessionId
      );

      if (invoiceData?.pdfUrl && invoiceData.invoiceId) {
        // Cache all invoice data for future requests
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            stripeInvoiceId: invoiceData.invoiceId,
            stripeInvoiceUrl: invoiceData.hostedUrl,
            stripeInvoicePdfUrl: invoiceData.pdfUrl,
          },
        });
        return streamPdfDownload(invoiceData.pdfUrl, invoiceData.invoiceId);
      }
    }

    // 8. No invoice available
    return NextResponse.json(
      { success: false, error: 'Invoice not available' },
      { status: 404 }
    );
  } catch (error) {
    logError(error, {
      operation: 'api/bookings/[bookingId]/invoice#get',
      requestId,
      bookingId,
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
