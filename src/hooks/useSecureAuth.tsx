import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { validateEmail, validateDisplayName, validatePassword, isRateLimited } from '@/lib/securityUtils';
import { useServerSideRateLimit } from './useServerSideRateLimit';
import { toast } from './use-toast';

/**
 * Enhanced auth hook with security validations
 */
export const useSecureAuth = () => {
  const auth = useAuth();
  const { checkRateLimit } = useServerSideRateLimit();

  const secureSignUp = useCallback(async (
    email: string, 
    password: string, 
    displayName: string, 
    userCategory?: string, 
    referralCode?: string
  ) => {
    // Server-side rate limiting
    const clientId = 'signup_' + (typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 50) : 'server');
    const rateLimitResult = await checkRateLimit(clientId, {
      maxRequests: 3,
      windowMs: 300000, // 5 minutes
      action: 'signup'
    });

    if (!rateLimitResult.allowed) {
      toast({
        title: "Too many attempts",
        description: rateLimitResult.message || "Please wait before trying to sign up again.",
        variant: "destructive"
      });
      return { error: new Error('Rate limited') };
    }

    // Client-side fallback rate limiting
    if (isRateLimited(clientId, 3, 300000)) {
      toast({
        title: "Too many attempts",
        description: "Please wait before trying to sign up again.",
        variant: "destructive"
      });
      return { error: new Error('Rate limited') };
    }

    // Input validation
    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return { error: new Error('Invalid email') };
    }

    if (!validateDisplayName(displayName)) {
      toast({
        title: "Invalid display name",
        description: "Display name must be 1-50 characters and cannot contain < or >.",
        variant: "destructive"
      });
      return { error: new Error('Invalid display name') };
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid password",
        description: passwordValidation.message,
        variant: "destructive"
      });
      return { error: new Error(passwordValidation.message) };
    }

    return auth.signUp(email, password, displayName, userCategory, referralCode);
  }, [auth, checkRateLimit]);

  const secureSignIn = useCallback(async (email: string, password: string) => {
    // Server-side rate limiting
    const clientId = 'signin_' + email;
    const rateLimitResult = await checkRateLimit(clientId, {
      maxRequests: 5,
      windowMs: 300000, // 5 minutes
      action: 'signin'
    });

    if (!rateLimitResult.allowed) {
      toast({
        title: "Too many attempts",
        description: rateLimitResult.message || "Please wait before trying to sign in again.",
        variant: "destructive"
      });
      return { error: new Error('Rate limited') };
    }

    // Client-side fallback rate limiting
    if (isRateLimited(clientId, 5, 300000)) {
      toast({
        title: "Too many attempts",
        description: "Please wait before trying to sign in again.",
        variant: "destructive"
      });
      return { error: new Error('Rate limited') };
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return { error: new Error('Invalid email') };
    }

    return auth.signIn(email, password);
  }, [auth, checkRateLimit]);

  return {
    ...auth,
    signUp: secureSignUp,
    signIn: secureSignIn
  };
};