/**
 * Location Image Upload with Server-Side Processing
 *
 * This module contains server-only code for image processing
 * using Sharp. It should only be imported in API routes.
 *
 * Creates a single optimized WebP image for location display.
 *
 * @module lib/utils/locationImageUpload
 * @server-only
 */

import 'server-only';

import { put } from '@vercel/blob';
import sharp from 'sharp';
import { serverInstance as rollbar } from '../monitoring/rollbar-official';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Location image dimensions - optimized for cards and detail views
const LOCATION_IMAGE_WIDTH = 800;
const LOCATION_IMAGE_HEIGHT = 600;
const LOCATION_IMAGE_QUALITY = 85;

export interface LocationImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  code?: string;
}

/**
 * Process and optimize location image
 *
 * Resizes and converts to WebP format for optimal compression.
 */
async function processLocationImage(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const originalWidth = metadata.width || LOCATION_IMAGE_WIDTH;
  const originalHeight = metadata.height || LOCATION_IMAGE_HEIGHT;
  const originalAspect = originalWidth / originalHeight;
  const targetAspect = LOCATION_IMAGE_WIDTH / LOCATION_IMAGE_HEIGHT;

  // Calculate crop dimensions to match target aspect ratio
  let cropWidth = originalWidth;
  let cropHeight = originalHeight;

  if (originalAspect > targetAspect) {
    // Original is wider - crop sides
    cropWidth = Math.round(originalHeight * targetAspect);
  } else {
    // Original is taller - crop top/bottom
    cropHeight = Math.round(originalWidth / targetAspect);
  }

  const left = Math.round((originalWidth - cropWidth) / 2);
  const top = Math.round((originalHeight - cropHeight) / 2);

  return sharp(imageBuffer)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(LOCATION_IMAGE_WIDTH, LOCATION_IMAGE_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: LOCATION_IMAGE_QUALITY })
    .toBuffer();
}

/**
 * Upload a location image and generate optimized version
 *
 * Creates an optimized WebP image (800x600) for location display.
 * All images are stored in the 'location-images/' folder in Blob storage.
 *
 * @server-only This function uses Sharp which requires Node.js environment
 */
export async function uploadLocationImage(
  file: File,
  imageType: 'exterior' | 'room' = 'exterior'
): Promise<LocationImageUploadResult> {
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

    // Process image
    const processedImage = await processLocationImage(buffer);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomUUID().split('-')[0];
    const filename = `location-images/${imageType}/${timestamp}-${randomString}.webp`;

    // Upload to Vercel Blob
    const blob = await put(filename, processedImage, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/webp',
    });

    rollbar.info('Location image uploaded', {
      action: 'upload',
      originalFileName: file.name,
      imageType,
      url: blob.url,
    });

    return {
      success: true,
      url: blob.url,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    rollbar.error('Failed to upload location image', error as Error, {
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
