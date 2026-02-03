/**
 * HTML Sanitization Utility
 * Removes potentially dangerous content from HTML to prevent XSS attacks
 */

/**
 * DOMPurify-like sanitization for server-side HTML content
 * Removes script tags, event handlers, and other dangerous attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove <script> tags and their content
  let sanitized = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  // Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Remove dangerous HTML5 attributes
  const dangerousAttrs = [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onmouseout',
    'onchange',
    'onsubmit',
    'onkeydown',
    'onkeyup',
  ];

  dangerousAttrs.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  return sanitized;
}

/**
 * Validate if HTML content is safe to store
 * Returns { safe: boolean, errors: string[] }
 */
export function validateHtmlContent(html: string): {
  safe: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!html || typeof html !== 'string') {
    errors.push('HTML content must be a non-empty string');
    return { safe: false, errors };
  }

  // Check for script tags
  if (/<script\b/i.test(html)) {
    errors.push('Script tags are not allowed');
  }

  // Check for event handlers
  if (/\s+on\w+\s*=/i.test(html)) {
    errors.push('Event handlers are not allowed');
  }

  // Check for javascript: protocol
  if (/javascript:/i.test(html)) {
    errors.push('JavaScript protocol is not allowed');
  }

  // Check for data:text/html (can execute scripts)
  if (/data:text\/html/i.test(html)) {
    errors.push('Data URI with HTML content is not allowed');
  }

  return {
    safe: errors.length === 0,
    errors,
  };
}
