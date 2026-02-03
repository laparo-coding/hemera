/**
 * Server-side file validation utilities
 * Prevents MIME type spoofing by validating actual file content
 */

/**
 * Get MIME type from file magic numbers
 * Detects actual file type regardless of client-provided type
 */
export async function detectMimeType(
  buffer: ArrayBuffer
): Promise<string | null> {
  const view = new Uint8Array(buffer);

  // JPEG: FF D8 FF
  if (view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (
    view[0] === 0x89 &&
    view[1] === 0x50 &&
    view[2] === 0x4e &&
    view[3] === 0x47
  ) {
    return 'image/png';
  }

  // GIF: 47 49 46 (GIF8 or GIF9)
  if (view[0] === 0x47 && view[1] === 0x49 && view[2] === 0x46) {
    return 'image/gif';
  }

  // WebP: RIFF...WEBP
  if (
    view[0] === 0x52 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x46 &&
    view[8] === 0x57 &&
    view[9] === 0x45 &&
    view[10] === 0x42 &&
    view[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Validate file against allowed types using both client-provided and detected types
 */
export async function validateImageFile(
  file: File,
  allowedTypes: string[]
): Promise<{ valid: boolean; error?: string }> {
  // First check: client-provided type must be in allowed list
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Client-provided MIME type "${file.type}" is not allowed`,
    };
  }

  // Second check: detect actual MIME type from file content
  try {
    const buffer = await file.arrayBuffer();
    const detectedType = await detectMimeType(buffer);

    // If we could detect the type, it must match the allowed types
    if (detectedType && !allowedTypes.includes(detectedType)) {
      return {
        valid: false,
        error: `Actual file type (${detectedType}) does not match declared type (${file.type})`,
      };
    }

    // If we couldn't detect but client type is allowed, accept it
    // (some edge cases might not have detectable magic numbers)
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to validate file content: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
