/**
 * GET /api/bookings/[bookingId]/invoice
 *
 * Downloads the Stripe invoice PDF for a specific booking.
 * Streams the PDF directly to trigger immediate download without blank page.
 */

import { currentUser } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db/prisma';
import { logError } from '../../../../../lib/errors';
import { validateInvoiceDownload } from '../../../../../lib/services/stripe-invoice';

interface RouteParams {
  params: Promise<{ bookingId: string }>;
}

/**
 * Fetches PDF from URL and returns it as a downloadable response
 */
async function streamPdfDownload(
  pdfUrl: string,
  invoiceId: string
): Promise<Response> {
  const pdfResponse = await fetch(pdfUrl);

  if (!pdfResponse.ok) {
    throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
  }

  const pdfBuffer = await pdfResponse.arrayBuffer();

  // Generate filename from invoice ID
  const filename = `rechnung-${invoiceId}.pdf`;

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.byteLength.toString(),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const requestId = crypto.randomUUID();
  const { bookingId } = await params;

  try {
    // 1. Authentication check
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Sync user to get DB user ID
    const { syncUserFromClerk } = await import('../../../../../lib/api/users');
    const syncedUser = await syncUserFromClerk(user);

    // 3. Find booking with user ownership check
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: syncedUser.id,
      },
      select: {
        id: true,
        paymentStatus: true,
        stripeSessionId: true,
        stripeInvoiceId: true,
        stripeInvoicePdfUrl: true,
      },
    });

    // 4. Check if booking exists
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // 5. Validate invoice can be downloaded
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

    // 6. Check if we have the PDF URL cached
    if (booking.stripeInvoicePdfUrl && booking.stripeInvoiceId) {
      return streamPdfDownload(
        booking.stripeInvoicePdfUrl,
        booking.stripeInvoiceId
      );
    }

    // 7. If no cached URL but we have invoice ID, fetch from Stripe
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

    // 8. If no invoice ID but we have session ID, try to get invoice from checkout session
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

    // 9. No invoice available
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
