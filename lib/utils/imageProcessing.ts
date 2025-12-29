/**
 * Image Processing Utility
 *
 * Generates multiple image sizes for course thumbnails:
 * - thumbnail: 400x90 (4.5:1) for Landing CourseCard
 * - detail: 900x200 (4.5:1) for Course Detail page
 * - twitter: 1200x630 for Twitter summary_large_image card
 */

import sharp from 'sharp';

export interface ImageVariant {
  name: 'thumbnail' | 'detail' | 'twitter';
  width: number;
  height: number;
  quality: number;
}

export interface ProcessedImages {
  thumbnail: Buffer;
  detail: Buffer;
  twitter: Buffer;
}

export interface CourseImageUrls {
  thumbnail: string;
  detail: string;
  twitter: string;
  /** Original uploaded URL (for backwards compatibility) */
  original: string;
}

/**
 * Image variant configurations
 *
 * - thumbnail: Used in Landing page CourseCard (height ~80px)
 * - detail: Used in CourseDetail hero (aspect ratio 4.5:1)
 * - twitter: Twitter Card summary_large_image (1200x630)
 */
export const IMAGE_VARIANTS: ImageVariant[] = [
  { name: 'thumbnail', width: 400, height: 90, quality: 85 },
  { name: 'detail', width: 900, height: 200, quality: 85 },
  { name: 'twitter', width: 1200, height: 630, quality: 90 },
];

/**
 * Process an image and create all required variants
 *
 * Uses sharp to resize and optimize images for different use cases.
 * All output images are WebP format for optimal compression.
 *
 * @param imageBuffer - The original image as a Buffer
 * @returns Object containing all processed image buffers
 */
export async function processImage(
  imageBuffer: Buffer
): Promise<ProcessedImages> {
  const sharpInstance = sharp(imageBuffer);

  // Get original image metadata for smart cropping
  const metadata = await sharpInstance.metadata();
  const originalWidth = metadata.width || 1200;
  const originalHeight = metadata.height || 800;
  const originalAspect = originalWidth / originalHeight;

  const results = await Promise.all(
    IMAGE_VARIANTS.map(async variant => {
      const targetAspect = variant.width / variant.height;

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

      const buffer = await sharp(imageBuffer)
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .resize(variant.width, variant.height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: variant.quality })
        .toBuffer();

      return { name: variant.name, buffer };
    })
  );

  return {
    thumbnail: results.find(r => r.name === 'thumbnail')!.buffer,
    detail: results.find(r => r.name === 'detail')!.buffer,
    twitter: results.find(r => r.name === 'twitter')!.buffer,
  };
}

/**
 * Generate filename for an image variant
 *
 * @param baseName - Base filename (without extension)
 * @param variant - The image variant name
 * @returns Filename with variant suffix and .webp extension
 */
export function getVariantFilename(
  baseName: string,
  variant: ImageVariant['name']
): string {
  return `${baseName}-${variant}.webp`;
}
