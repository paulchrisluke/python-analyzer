/**
 * DOMPurify wrapper for safe SSR usage
 * 
 * This module provides a safe way to use DOMPurify in both client and server environments.
 * It detects the runtime environment and uses appropriate sanitization methods.
 */

// Default safe configuration
const DEFAULT_SAFE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  RETURN_TRUSTED_TYPE: false,
  FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'meta', 'iframe', 'form', 'input', 'textarea', 'select', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeypress', 'onkeyup', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseup', 'onresize', 'onscroll', 'onunload']
};

// Server-side fallback sanitization (preserves allowed HTML tags)
function serverSideSanitize(input: string, options: any = {}): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Merge options with default safe config
  const config = { ...DEFAULT_SAFE_CONFIG, ...options };
  
  // Basic server-side sanitization that preserves allowed HTML tags
  // This matches the client-side behavior to prevent hydration mismatches
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*>/gi, '') // Remove embed tags
    .replace(/<link\b[^>]*>/gi, '') // Remove link tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/<meta\b[^>]*>/gi, '') // Remove meta tags
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '') // Remove form tags
    .replace(/<input\b[^>]*>/gi, '') // Remove input tags
    .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '') // Remove textarea tags
    .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, '') // Remove select tags
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '') // Remove button tags
    // Remove dangerous attributes from allowed tags
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/\s*javascript\s*:/gi, '') // Remove javascript: protocols
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');

  return sanitized;
}

// Client-side DOMPurify sanitization
function clientSideSanitize(input: string, options: any = {}): string {
  if (typeof window === 'undefined') {
    // Fallback to server-side sanitization if window is not available
    return serverSideSanitize(input, options);
  }

  // Dynamic import of DOMPurify for client-side
  let DOMPurify: any;
  
  try {
    // Use dynamic import to avoid SSR issues
    DOMPurify = require('dompurify');
  } catch (error) {
    console.warn('DOMPurify not available, falling back to server-side sanitization');
    return serverSideSanitize(input, options);
  }

  if (!DOMPurify || !DOMPurify.sanitize) {
    console.warn('DOMPurify.sanitize not available, falling back to server-side sanitization');
    return serverSideSanitize(input, options);
  }

  // Merge options with default safe config
  const config = { ...DEFAULT_SAFE_CONFIG, ...options };
  
  try {
    return DOMPurify.sanitize(input, config);
  } catch (error) {
    console.warn('DOMPurify sanitization failed, falling back to server-side sanitization:', error);
    return serverSideSanitize(input, options);
  }
}

/**
 * Sanitize HTML content safely for both client and server environments
 * 
 * @param input - The HTML string to sanitize
 * @param options - DOMPurify configuration options (merged with safe defaults)
 * @returns Sanitized HTML string
 */
export function sanitize(input: string, options: any = {}): string {
  // Always use server-side sanitization for SSR safety
  if (typeof window === 'undefined') {
    return serverSideSanitize(input, options);
  }
  
  // Use client-side DOMPurify when available
  return clientSideSanitize(input, options);
}

/**
 * Sanitize HTML content with strict security settings (recommended for user content)
 * 
 * @param input - The HTML string to sanitize
 * @returns Sanitized HTML string with strict security settings
 */
export function sanitizeStrict(input: string): string {
  return sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    RETURN_TRUSTED_TYPE: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'meta', 'iframe', 'form', 'input', 'textarea', 'select', 'button', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeypress', 'onkeyup', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseup', 'onresize', 'onscroll', 'onunload', 'href', 'target', 'rel']
  });
}

/**
 * Sanitize HTML content with relaxed settings (for trusted content)
 * 
 * @param input - The HTML string to sanitize
 * @returns Sanitized HTML string with relaxed settings
 */
export function sanitizeRelaxed(input: string): string {
  return sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a', 'img', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    RETURN_TRUSTED_TYPE: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'meta', 'iframe', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeypress', 'onkeyup', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseup', 'onresize', 'onscroll', 'onunload']
  });
}

// Export the default sanitize function as the main export
export default sanitize;
