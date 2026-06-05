/**
 * HTML Sanitization Utility
 * Implements defense-in-depth HTML sanitization to prevent XSS attacks.
 * Uses multiple complementary sanitization strategies:
 * - Removal of dangerous tag types (script, iframe, style)
 * - Removal of event handlers
 * - Removal of dangerous protocols
 * - Removal of suspicious attributes
 */

/**
 * Sanitizes HTML content by removing dangerous tags, attributes, and protocols
 * Implements defense-in-depth approach: removes multiple XSS attack vectors
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    // Clean HTML content through multiple sanitization passes
    const cleaned = cleanHtmlContent(html);
    return cleaned;
  } catch {
    // If processing fails, return empty string for safety
    return '';
  }
}

/**
 * Cleans HTML content by removing disallowed tags and attributes
 */
function cleanHtmlContent(html: string): string {
  let result = html;

  // Remove script tags and content
  result = result.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  // Remove iframe tags and content
  result = result.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ''
  );

  // Remove style tags and content (can contain expressions)
  result = result.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ''
  );

  // Remove SVG script/style contents
  result = result.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');

  // Remove any event handler attributes (comprehensive)
  result = removeEventHandlers(result);

  // Remove dangerous protocols
  result = removeDangerousProtocols(result);

  // Remove data attributes that could contain scripts
  result = result.replace(/data-[a-z-]*=["'][^"']*["']/gi, '');

  // Remove style tags with expressions
  result = result.replace(
    /style=["'][^"']*(?:expression|behavior)[^"']*["']/gi,
    ''
  );

  return result;
}

/**
 * Decodes HTML entities to check for obfuscated attacks
 * Handles both semicolon-terminated and semicolon-free entities
 */
function decodeHtmlEntities(str: string): string {
  const entityMap: Record<string, string> = {
    '&#39;': "'",
    '&quot;': '"',
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
  };

  let result = str;
  Object.entries(entityMap).forEach(([entity, char]) => {
    result = result.replace(new RegExp(entity, 'g'), char);
  });

  // Decode numeric entities with semicolon (&#123; or &#xAB;)
  result = result.replace(/&#(\d+);/g, (_match, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });
  result = result.replace(/&#x([0-9A-Fa-f]+);/g, (_match, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });

  // Decode numeric entities without semicolon (HTML5 style: &#123x or &#xABx where x is non-hex/non-digit)
  // This handles cases like j&#X41vascript where &#X41 decodes to 'A'
  result = result.replace(/&#(\d+)(?=[^0-9;]|$)/g, (_match, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });
  result = result.replace(
    /&#[xX]([0-9A-Fa-f]+)(?=[^0-9A-Fa-f;]|$)/g,
    (_match, code) => {
      return String.fromCharCode(parseInt(code, 16));
    }
  );

  return result;
}

/**
 * Removes all event handler attributes
 */
function removeEventHandlers(html: string): string {
  let result = html;

  // Remove all on* event handlers
  result = result.replace(/\s+on[a-z]+\s*=\s*["'][^"']*["']/gi, '');

  // Remove event handlers without quotes
  result = result.replace(/\s+on[a-z]+\s*=\s*[^\s>]*/gi, '');

  return result;
}

/**
 * Removes dangerous protocols from href, src, action, and other attributes
 */
function removeDangerousProtocols(html: string): string {
  let result = html;

  // Helper function to check if a value contains dangerous protocols
  const hasDangerousProtocol = (value: string): boolean => {
    const decoded = decodeHtmlEntities(value);
    return (
      /javascript:/i.test(decoded) ||
      /vbscript:/i.test(decoded) ||
      /data:text\/html/i.test(decoded)
    );
  };

  // Remove attributes with dangerous protocols (quoted values)
  result = result.replace(
    /((?:href|src|action|style)\s*=\s*)"([^"]*)"/gi,
    (_match, _attr, value) => {
      if (hasDangerousProtocol(value)) {
        return ''; // Remove the entire attribute
      }
      return _match;
    }
  );

  // Remove attributes with dangerous protocols (single-quoted values)
  result = result.replace(
    /((?:href|src|action|style)\s*=\s*)'([^']*)'/gi,
    (_match, _attr, value) => {
      if (hasDangerousProtocol(value)) {
        return ''; // Remove the entire attribute
      }
      return _match;
    }
  );

  // Remove attributes without quotes (unquoted attribute values)
  result = result.replace(
    /\s(?:href|src|action)\s*=\s*([^\s>]*)/gi,
    (_match, value) => {
      if (hasDangerousProtocol(value)) {
        return ''; // Remove the entire attribute
      }
      return _match;
    }
  );

  return result;
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

  // Check for iframe tags
  if (/<iframe\b/i.test(html)) {
    errors.push('IFrame tags are not allowed');
  }

  // Check for style tags with expressions
  if (/<style\b/i.test(html)) {
    errors.push('Style tags are not allowed');
  }

  // Check for event handlers
  if (/\s+on[a-z]+\s*=/i.test(html)) {
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

  // Check for vbscript: protocol
  if (/vbscript:/i.test(html)) {
    errors.push('VBScript protocol is not allowed');
  }

  // Check for SVG with script tags
  if (/<svg[^>]*>[\s\S]*?<script/i.test(html)) {
    errors.push('SVG with script content is not allowed');
  }

  return {
    safe: errors.length === 0,
    errors,
  };
}
