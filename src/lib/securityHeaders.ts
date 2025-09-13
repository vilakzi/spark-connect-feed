/**
 * Security headers configuration for enhanced protection
 */

export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Strict-Transport-Security'?: string;
  'Permissions-Policy'?: string;
}

export const getSecurityHeaders = (includeCSP = true): SecurityHeaders => {
  const headers: SecurityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  };

  // Add HTTPS-only headers for production
  if (window.location.protocol === 'https:') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  // Content Security Policy - relaxed for development and publishing
  if (includeCSP && window.location.hostname !== 'localhost' && !window.location.hostname.includes('lovable')) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "font-src 'self' https:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    headers['Content-Security-Policy'] = csp;
  }

  return headers;
};

export const applySecurityHeaders = () => {
  const headers = getSecurityHeaders();
  
  // Apply headers via meta tags for client-side
  Object.entries(headers).forEach(([name, value]) => {
    let meta = document.querySelector(`meta[http-equiv="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('http-equiv', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', value);
  });
};

export const createSecureResponse = (data: any, status = 200): Response => {
  const headers = new Headers();
  const securityHeaders = getSecurityHeaders();
  
  // Set security headers
  Object.entries(securityHeaders).forEach(([name, value]) => {
    if (value) headers.set(name, value);
  });
  
  headers.set('Content-Type', 'application/json');
  
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
};