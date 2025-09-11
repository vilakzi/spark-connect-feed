import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  action: string;
}

export const useServerSideRateLimit = () => {
  const checkRateLimit = useCallback(async (
    key: string, 
    options: RateLimitOptions
  ): Promise<{ allowed: boolean; message?: string; retryAfter?: number }> => {
    try {
      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: {
          key,
          maxRequests: options.maxRequests,
          windowMs: options.windowMs,
          action: options.action
        }
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the request but log it
        return { allowed: true };
      }

      if (data?.rateLimited) {
        return { 
          allowed: false, 
          message: data.message || 'Rate limit exceeded',
          retryAfter: data.retryAfter 
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // On network error, allow the request
      return { allowed: true };
    }
  }, []);

  return { checkRateLimit };
};