/**
 * Enhanced data validation utilities with security focus
 */

import { sanitizeString } from './securityUtils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

export const validateAndSanitizeInput = (
  value: string, 
  rules: {
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
    required?: boolean;
    allowedChars?: RegExp;
  }
): ValidationResult => {
  const result: ValidationResult = { isValid: true, errors: [] };
  
  // Required validation
  if (rules.required && (!value || value.trim().length === 0)) {
    result.errors.push('This field is required');
    result.isValid = false;
    return result;
  }
  
  if (!value) {
    result.sanitizedValue = '';
    return result;
  }
  
  // Sanitize the input
  const sanitized = sanitizeString(value);
  result.sanitizedValue = sanitized;
  
  // Length validations
  if (rules.maxLength && sanitized.length > rules.maxLength) {
    result.errors.push(`Maximum length is ${rules.maxLength} characters`);
    result.isValid = false;
  }
  
  if (rules.minLength && sanitized.length < rules.minLength) {
    result.errors.push(`Minimum length is ${rules.minLength} characters`);
    result.isValid = false;
  }
  
  // Pattern validation
  if (rules.pattern && !rules.pattern.test(sanitized)) {
    result.errors.push('Invalid format');
    result.isValid = false;
  }
  
  // Allowed characters validation
  if (rules.allowedChars && !rules.allowedChars.test(sanitized)) {
    result.errors.push('Contains invalid characters');
    result.isValid = false;
  }
  
  return result;
};

export const validateFileUpload = (file: File): ValidationResult => {
  const result: ValidationResult = { isValid: true, errors: [] };
  
  // File size validation (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    result.errors.push('File size must be less than 10MB');
    result.isValid = false;
  }
  
  // File type validation
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf', 'text/plain'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    result.errors.push('File type not allowed');
    result.isValid = false;
  }
  
  // Filename validation
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
  if (sanitizedName !== file.name) {
    result.errors.push('Filename contains invalid characters');
    result.isValid = false;
  }
  
  result.sanitizedValue = sanitizedName;
  return result;
};

export const validateUrl = (url: string): ValidationResult => {
  const result: ValidationResult = { isValid: true, errors: [] };
  
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTPS in production
    if (window.location.protocol === 'https:' && urlObj.protocol !== 'https:') {
      result.errors.push('Only HTTPS URLs are allowed');
      result.isValid = false;
    }
    
    // Block potentially dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(proto => url.toLowerCase().startsWith(proto))) {
      result.errors.push('URL protocol not allowed');
      result.isValid = false;
    }
    
    result.sanitizedValue = urlObj.href;
  } catch {
    result.errors.push('Invalid URL format');
    result.isValid = false;
  }
  
  return result;
};

export const validateJson = (jsonString: string): ValidationResult => {
  const result: ValidationResult = { isValid: true, errors: [] };
  
  try {
    const parsed = JSON.parse(jsonString);
    
    // Check for potential prototype pollution
    if (typeof parsed === 'object' && parsed !== null) {
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      const hasDangerousKeys = JSON.stringify(parsed).includes(dangerousKeys.join('|'));
      
      if (hasDangerousKeys) {
        result.errors.push('JSON contains potentially dangerous properties');
        result.isValid = false;
      }
    }
    
    result.sanitizedValue = parsed;
  } catch {
    result.errors.push('Invalid JSON format');
    result.isValid = false;
  }
  
  return result;
};