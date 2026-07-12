import { NextResponse } from 'next/server';

/**
 * Validates a file upload against extension and size constraints.
 * Returns null if valid, or a NextResponse error if invalid.
 */
export function validateFileUpload(
  file: File,
  options: {
    allowedExtensions: string[];
    maxSize: number;
    label: string;
  }
): NextResponse | null {
  const hasValidExtension = options.allowedExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );
  if (!hasValidExtension) {
    return NextResponse.json(
      {
        error: 'validation_error',
        message: `Nur ${options.label} sind erlaubt`,
      },
      { status: 400 }
    );
  }
  if (file.size > options.maxSize) {
    return NextResponse.json(
      {
        error: 'validation_error',
        message: `Datei darf maximal ${options.maxSize / 1024 / 1024} MB groß sein`,
      },
      { status: 400 }
    );
  }
  return null;
}
