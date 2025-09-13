/**
 * Content Security Utilities for XSS Prevention
 */

import { sanitizeString, sanitizeHtml } from './securityUtils';

/**
 * Sanitize user-generated content for safe display
 */
export const sanitizeUserContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  return sanitizeHtml(content);
};

/**
 * Sanitize text content (strips all HTML)
 */
export const sanitizeTextContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  return sanitizeString(content);
};

/**
 * Validate and sanitize bio content
 */
export const sanitizeBio = (bio: string): string => {
  if (!bio || typeof bio !== 'string') {
    return '';
  }
  
  // Allow basic formatting but sanitize dangerous content
  return sanitizeHtml(bio.slice(0, 500)); // Limit length
};

/**
 * Sanitize message content for chat
 */
export const sanitizeMessage = (message: string): string => {
  if (!message || typeof message !== 'string') {
    return '';
  }
  
  // For chat messages, use text content only (no HTML)
  return sanitizeString(message.slice(0, 1000)); // Limit length
};

/**
 * Sanitize display names
 */
export const sanitizeDisplayName = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return sanitizeString(name.slice(0, 50)); // Limit length
};

/**
 * Create safe CSS values to prevent CSS injection
 */
export const safeCssValue = (value: string): string => {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  // Remove any potentially dangerous CSS characters
  return value.replace(/[<>'"\\`]/g, '');
};

/**
 * Validate theme configuration to prevent XSS in dynamic styles
 */
export const validateThemeConfig = (config: Record<string, any>): Record<string, any> => {
  const safeConfig: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      // Validate CSS color values and other safe properties
      if (/^(#[0-9a-f]{3,8}|hsl\([^)]+\)|rgb\([^)]+\)|\w+)$/i.test(value)) {
        safeConfig[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      safeConfig[key] = validateThemeConfig(value);
    }
  }
  
  return safeConfig;
};