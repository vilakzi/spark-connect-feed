/**
 * Security utilities for input validation and sanitization
 */

// Input sanitization
export const sanitizeString = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const validateDisplayName = (name: string): boolean => {
  return name.length >= 1 && name.length <= 50 && !/[<>]/.test(name);
};

// Rate limiting helpers
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const isRateLimited = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (record.count >= maxRequests) {
    return true;
  }
  
  record.count++;
  return false;
};

// Content Security Policy helpers
export const createSecureImageUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const allowedDomains = ['supabase.co', 'githubusercontent.com', 'unsplash.com'];
    
    if (allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return url;
    }
    
    return '/placeholder.svg';
  } catch {
    return '/placeholder.svg';
  }
};

// Safe DOM manipulation
export const createSecureElement = (tagName: string, textContent: string, className?: string): HTMLElement => {
  const element = document.createElement(tagName);
  element.textContent = textContent; // Safe from XSS
  if (className) element.className = className;
  return element;
};