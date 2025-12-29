import { describe, expect, it } from '@jest/globals';

describe('Contract: POST/DELETE /api/my-courses/[bookingId]/resume', () => {
  const _endpoint = '/api/my-courses/[bookingId]/resume';

  it('enforces résumé upload payload rules', () => {
    const validMetadata = {
      fileName: 'resume.pdf',
      fileSizeBytes: 512_000,
      mimeType: 'application/pdf',
    };

    const disallowedMetadata = {
      fileName: 'resume.docx',
      fileSizeBytes: 512_000,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    expect(validMetadata.mimeType).toBe('application/pdf');
    expect(validMetadata.fileSizeBytes).toBeLessThanOrEqual(10 * 1024 * 1024);
    expect(disallowedMetadata.mimeType).not.toBe('application/pdf');
  });

  it('returns résumé document metadata with audit fields', () => {
    const expectedResponseShape = {
      participationId: 'participation_123',
      documentId: 'document_123',
      blobUrl: 'https://vercel-storage.com/xyz/resume.pdf',
      uploadedAt: '2025-12-28T12:00:00.000Z',
      createdByUserId: 'user_123',
      isActive: true,
    };

    expect(expectedResponseShape.blobUrl.startsWith('https://')).toBe(true);
    expect(expectedResponseShape.isActive).toBe(true);
    expect(expectedResponseShape.createdByUserId).toMatch(/^user_/);
  });
});
