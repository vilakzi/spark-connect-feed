/**
 * Security utilities for input validation and sanitization
 */

// Enhanced input sanitization
export const sanitizeString = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
              .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
              .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
              .replace(/<embed\b[^<]*>/gi, '')
              .replace(/data:\s*text\/html/gi, '');
};

export const sanitizeHtml = (input: string): string => {
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi;
  
  return input.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    }
    return '';
  });
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

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  return { isValid: true };
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