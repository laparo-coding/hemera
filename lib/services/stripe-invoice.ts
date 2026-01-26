/**
 * Stripe Invoice Service
 *
 * Handles retrieval of invoice PDFs from Stripe for completed bookings.
 */

import Stripe from 'stripe';
import { logError } from '../errors';
import { STRIPE_API_VERSION } from '../stripe/config';

// Lazy-initialize Stripe client to avoid issues during build
let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION,
    });
  }
  return stripeClient;
}

/**
 * Invoice status that allows PDF download
 */
const DOWNLOADABLE_STATUSES = ['paid', 'open'] as const;

/**
 * Retrieves the PDF URL for a Stripe invoice.
 *
 * @param invoiceId The Stripe invoice ID (e.g., 'in_xxx')
 * @returns The PDF URL if available, null otherwise
 */
export async function getInvoicePdfUrl(
  invoiceId: string
): Promise<string | null> {
  // Validate input
  if (!invoiceId || typeof invoiceId !== 'string') {
    return null;
  }

  try {
    const stripe = getStripeClient();
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Only return PDF URL for paid or open invoices
    if (
      DOWNLOADABLE_STATUSES.includes(
        invoice.status as (typeof DOWNLOADABLE_STATUSES)[number]
      ) &&
      invoice.invoice_pdf
    ) {
      return invoice.invoice_pdf;
    }

    return null;
  } catch (error) {
    logError(error, {
      operation: 'stripe-invoice#getInvoicePdfUrl',
      invoiceId,
    });
    return null;
  }
}

/**
 * Retrieves the hosted invoice URL for viewing in browser.
 *
 * @param invoiceId The Stripe invoice ID
 * @returns The hosted invoice URL if available, null otherwise
 */
export async function getHostedInvoiceUrl(
  invoiceId: string
): Promise<string | null> {
  if (!invoiceId || typeof invoiceId !== 'string') {
    return null;
  }

  try {
    const stripe = getStripeClient();
    const invoice = await stripe.invoices.retrieve(invoiceId);

    return invoice.hosted_invoice_url || null;
  } catch (error) {
    logError(error, {
      operation: 'stripe-invoice#getHostedInvoiceUrl',
      invoiceId,
    });
    return null;
  }
}

/**
 * Retrieves invoice details from Stripe.
 *
 * @param invoiceId The Stripe invoice ID
 * @returns Invoice details or null if not found
 */
export async function getInvoiceDetails(invoiceId: string): Promise<{
  id: string;
  status: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
  amountPaid: number;
  currency: string;
  created: Date;
} | null> {
  if (!invoiceId || typeof invoiceId !== 'string') {
    return null;
  }

  try {
    const stripe = getStripeClient();
    const invoice = await stripe.invoices.retrieve(invoiceId);

    return {
      id: invoice.id,
      status: invoice.status || 'unknown',
      pdfUrl: invoice.invoice_pdf || null,
      hostedUrl: invoice.hosted_invoice_url || null,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      created: new Date(invoice.created * 1000),
    };
  } catch (error) {
    logError(error, {
      operation: 'stripe-invoice#getInvoiceDetails',
      invoiceId,
    });
    return null;
  }
}

/**
 * Validates that a booking can have its invoice downloaded.
 *
 * @param paymentStatus The booking's payment status
 * @param invoiceId The Stripe invoice ID from the booking
 * @returns Object with validation result and error message
 */
export function validateInvoiceDownload(
  paymentStatus: string,
  invoiceId: string | null | undefined
): { valid: boolean; error?: string } {
  // Check payment status
  const paidStatuses = ['PAID', 'CONFIRMED'];
  if (!paidStatuses.includes(paymentStatus)) {
    return {
      valid: false,
      error: 'Invoice download is only available for paid bookings',
    };
  }

  // Invoice ID is now optional - we can look it up from checkout session
  return { valid: true };
}

/**
 * Retrieves invoice information from a Stripe checkout session.
 * Useful for backfilling invoice data for existing bookings.
 *
 * @param sessionId The Stripe checkout session ID
 * @returns Invoice details or null if not found
 */
export async function getInvoiceFromCheckoutSession(
  sessionId: string
): Promise<{
  invoiceId: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
} | null> {
  if (!sessionId || typeof sessionId !== 'string') {
    return null;
  }

  try {
    const stripe = getStripeClient();

    // Retrieve the checkout session with invoice expanded
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['invoice'],
    });

    // Check if session has an invoice
    const invoice = session.invoice;
    if (!invoice) {
      return null;
    }

    // Handle both string ID and expanded Invoice object
    if (typeof invoice === 'string') {
      // Invoice is just an ID, fetch full details
      const fullInvoice = await stripe.invoices.retrieve(invoice);
      return {
        invoiceId: fullInvoice.id,
        pdfUrl: fullInvoice.invoice_pdf || null,
        hostedUrl: fullInvoice.hosted_invoice_url || null,
      };
    }

    // Invoice is expanded
    return {
      invoiceId: invoice.id,
      pdfUrl: invoice.invoice_pdf || null,
      hostedUrl: invoice.hosted_invoice_url || null,
    };
  } catch (error) {
    logError(error, {
      operation: 'stripe-invoice#getInvoiceFromCheckoutSession',
      sessionId,
    });
    return null;
  }
}
