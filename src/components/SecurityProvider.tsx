import { useEffect } from 'react';
import { applySecurityHeaders } from '@/lib/securityHeaders';

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  useEffect(() => {
    // Apply security headers on mount
    applySecurityHeaders();
    
    // Set up CSP violation reporting
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      console.warn('CSP Violation:', {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber
      });
      
      // Log to secure logger if available
      import('@/lib/secureLogger').then(({ logWarn }) => {
        logWarn('CSP violation detected', {
          directive: event.violatedDirective,
          uri: event.blockedURI
        });
      });
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, []);

  return <>{children}</>;
};