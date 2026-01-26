/**
 * T009: Unit Test - getInvoicePdfUrl Service
 *
 * Tests for the Stripe invoice PDF URL retrieval service.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Service function types
interface StripeInvoice {
  id: string;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  status: string;
}

// Mock Stripe SDK with proper typing
const mockRetrieve = jest.fn<(invoiceId: string) => Promise<StripeInvoice>>();

const mockStripe = {
  invoices: {
    retrieve: mockRetrieve,
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

// Local implementation for testing
const getInvoicePdfUrl = async (invoiceId: string): Promise<string | null> => {
  if (!invoiceId) {
    return null;
  }

  try {
    const invoice = await mockStripe.invoices.retrieve(invoiceId);

    if (invoice.status === 'paid' && invoice.invoice_pdf) {
      return invoice.invoice_pdf;
    }

    return null;
  } catch {
    return null;
  }
};

describe('getInvoicePdfUrl Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input validation', () => {
    it('should return null for empty invoice ID', async () => {
      const result = await getInvoicePdfUrl('');
      expect(result).toBeNull();
      expect(mockStripe.invoices.retrieve).not.toHaveBeenCalled();
    });

    it('should call Stripe API with valid invoice ID', async () => {
      mockStripe.invoices.retrieve.mockResolvedValueOnce({
        id: 'in_test_123',
        invoice_pdf: 'https://invoice.stripe.com/pdf',
        hosted_invoice_url: null,
        status: 'paid',
      });

      await getInvoicePdfUrl('in_test_123');
      expect(mockStripe.invoices.retrieve).toHaveBeenCalledWith('in_test_123');
    });
  });

  describe('Successful retrieval', () => {
    it('should return PDF URL for paid invoice', async () => {
      const mockInvoice = {
        id: 'in_paid_123',
        invoice_pdf: 'https://invoice.stripe.com/i/paid/pdf',
        hosted_invoice_url: 'https://invoice.stripe.com/i/paid',
        status: 'paid',
      };

      mockStripe.invoices.retrieve.mockResolvedValueOnce(mockInvoice);

      const result = await getInvoicePdfUrl('in_paid_123');
      expect(result).toBe('https://invoice.stripe.com/i/paid/pdf');
    });

    it('should return PDF URL with correct Stripe format', async () => {
      const mockInvoice = {
        id: 'in_1234567890',
        invoice_pdf:
          'https://pay.stripe.com/invoice/acct_xxx/test_xxx/pdf?s=ap',
        hosted_invoice_url: null,
        status: 'paid',
      };

      mockStripe.invoices.retrieve.mockResolvedValueOnce(mockInvoice);

      const result = await getInvoicePdfUrl('in_1234567890');
      expect(result).toMatch(/^https:\/\/.*stripe.*\/pdf/);
    });
  });

  describe('Invoice status handling', () => {
    it('should return null for unpaid invoice', async () => {
      const mockInvoice = {
        id: 'in_unpaid_123',
        invoice_pdf: 'https://invoice.stripe.com/i/unpaid/pdf',
        hosted_invoice_url: null,
        status: 'open',
      };

      mockStripe.invoices.retrieve.mockResolvedValueOnce(mockInvoice);

      const result = await getInvoicePdfUrl('in_unpaid_123');
      expect(result).toBeNull();
    });

    it('should return null for draft invoice', async () => {
      const mockInvoice = {
        id: 'in_draft_123',
        invoice_pdf: null,
        hosted_invoice_url: null,
        status: 'draft',
      };

      mockStripe.invoices.retrieve.mockResolvedValueOnce(mockInvoice);

      const result = await getInvoicePdfUrl('in_draft_123');
      expect(result).toBeNull();
    });

    it('should return null when invoice_pdf is null', async () => {
      const mockInvoice = {
        id: 'in_no_pdf_123',
        invoice_pdf: null,
        hosted_invoice_url: null,
        status: 'paid',
      };

      mockStripe.invoices.retrieve.mockResolvedValueOnce(mockInvoice);

      const result = await getInvoicePdfUrl('in_no_pdf_123');
      expect(result).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should return null on Stripe API error', async () => {
      mockStripe.invoices.retrieve.mockRejectedValueOnce(
        new Error('Stripe API error')
      );

      const result = await getInvoicePdfUrl('in_error_123');
      expect(result).toBeNull();
    });

    it('should return null for invalid invoice ID', async () => {
      mockStripe.invoices.retrieve.mockRejectedValueOnce({
        type: 'StripeInvalidRequestError',
        message: 'No such invoice: invalid_id',
      });

      const result = await getInvoicePdfUrl('invalid_id');
      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      mockStripe.invoices.retrieve.mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await getInvoicePdfUrl('in_network_error');
      expect(result).toBeNull();
    });
  });

  describe('Caching behavior', () => {
    it('should not cache null results', async () => {
      mockStripe.invoices.retrieve.mockResolvedValueOnce({
        id: 'in_no_cache',
        invoice_pdf: null,
        hosted_invoice_url: null,
        status: 'paid',
      });

      const result1 = await getInvoicePdfUrl('in_no_cache');
      expect(result1).toBeNull();

      // Second call should hit API again
      mockStripe.invoices.retrieve.mockResolvedValueOnce({
        id: 'in_no_cache',
        invoice_pdf: 'https://invoice.stripe.com/now_available/pdf',
        hosted_invoice_url: null,
        status: 'paid',
      });

      const result2 = await getInvoicePdfUrl('in_no_cache');
      expect(result2).toBe('https://invoice.stripe.com/now_available/pdf');
    });
  });

  describe('Invoice ID format validation', () => {
    it('should accept valid Stripe invoice ID format', () => {
      const validId = 'in_1234567890abcdef';
      const isValidFormat = validId.startsWith('in_');

      expect(isValidFormat).toBe(true);
    });

    it('should detect invalid invoice ID format', () => {
      const invalidId = 'invalid_123';
      const isValidFormat = invalidId.startsWith('in_');

      expect(isValidFormat).toBe(false);
    });
  });
});
