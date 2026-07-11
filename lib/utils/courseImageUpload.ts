/**
 * Course Image Upload with Server-Side Processing
 *
 * This module contains server-only code for image processing
 * using Sharp. It should only be imported in API routes.
 *
 * @module lib/utils/courseImageUpload
 * @server-only
 */

import 'server-only';

import { put } from '@vercel/blob';
import { serverInstance as rollbar } from '../monitoring/rollbar-official';
import {
  type CourseImageUrls,
  getVariantFilename,
  IMAGE_VARIANTS,
  processImage,
} from './imageProcessing';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface CourseImageUploadResult {
  success: boolean;
  urls?: CourseImageUrls;
  error?: string;
  code?: string;
}

/**
 * Upload a course image and generate all required variants
 *
 * Creates three optimized image variants:
 * - thumbnail: 400x90 (4.5:1) for Landing CourseCard
 * - detail: 900x200 (4.5:1) for Course Detail page
 * - twitter: 1200x630 for Twitter summary_large_image card
 *
 * All variants are stored in WebP format for optimal compression.
 *
 * @server-only This function uses Sharp which requires Node.js environment
 */
export async function uploadCourseImage(
  file: File
): Promise<CourseImageUploadResult> {
  try {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
        code: 'INVALID_FILE_TYPE',
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        code: 'FILE_TOO_LARGE',
      };
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image into variants
    const processedImages = await processImage(buffer);

    // Generate unique base filename
    const timestamp = Date.now();
    const randomString = crypto.randomUUID().split('-')[0];
    const baseName = `course-images/${timestamp}-${randomString}`;

    // Upload original file
    const originalBlob = await put(`${baseName}-original.webp`, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/webp',
    });

    // Upload all variants in parallel
    const [thumbnailBlob, detailBlob, twitterBlob] = await Promise.all([
      put(
        getVariantFilename(baseName, 'thumbnail'),
        processedImages.thumbnail,
        {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'image/webp',
        }
      ),
      put(getVariantFilename(baseName, 'detail'), processedImages.detail, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/webp',
      }),
      put(getVariantFilename(baseName, 'twitter'), processedImages.twitter, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/webp',
      }),
    ]);

    rollbar.info('Course image uploaded with variants', {
      action: 'upload',
      originalFileName: file.name,
      variants: IMAGE_VARIANTS.map(v => v.name),
    });

    return {
      success: true,
      urls: {
        thumbnail: thumbnailBlob.url,
        detail: detailBlob.url,
        twitter: twitterBlob.url,
        original: originalBlob.url,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    rollbar.error('Failed to upload course image', error as Error, {
      action: 'upload',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      errorMessage,
    });

    return {
      success: false,
      error: 'Failed to upload file. Please try again.',
      code: 'BLOB_UPLOAD_FAILED',
    };
  }
}
