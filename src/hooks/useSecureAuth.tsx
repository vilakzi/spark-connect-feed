import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { validateEmail, validateDisplayName, isRateLimited } from '@/lib/securityUtils';
import { toast } from './use-toast';

/**
 * Enhanced auth hook with security validations
 */
export const useSecureAuth = () => {
  const auth = useAuth();

  const secureSignUp = useCallback(async (
    email: string, 
    password: string, 
    displayName: string, 
    userCategory?: string, 
    referralCode?: string
  ) => {
    // Rate limiting
    const clientId = 'signup_' + (typeof window !== 'undefined' ? window.navigator.userAgent : 'server');
    if (isRateLimited(clientId, 3, 300000)) { // 3 attempts per 5 minutes
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

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return { error: new Error('Password too short') };
    }

    return auth.signUp(email, password, displayName, userCategory, referralCode);
  }, [auth]);

  const secureSignIn = useCallback(async (email: string, password: string) => {
    // Rate limiting
    const clientId = 'signin_' + email;
    if (isRateLimited(clientId, 5, 300000)) { // 5 attempts per 5 minutes per email
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
  }, [auth]);

  return {
    ...auth,
    signUp: secureSignUp,
    signIn: secureSignIn
  };
};