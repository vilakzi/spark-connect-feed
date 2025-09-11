import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitRequest {
  key: string;
  maxRequests: number;
  windowMs: number;
  action: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { key, maxRequests, windowMs, action }: RateLimitRequest = await req.json();
    
    if (!key || !maxRequests || !windowMs || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    // Clean up old entries (older than window)
    await supabase
      .from('rate_limits')
      .delete()
      .lt('created_at', windowStart.toISOString());

    // Count requests in current window
    const { data: existingRequests, error: countError } = await supabase
      .from('rate_limits')
      .select('id')
      .eq('rate_key', key)
      .gte('created_at', windowStart.toISOString());

    if (countError) {
      console.error('Error counting requests:', countError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const currentCount = existingRequests?.length || 0;

    if (currentCount >= maxRequests) {
      console.log(`Rate limit exceeded for key: ${key}, count: ${currentCount}, max: ${maxRequests}`);
      return new Response(
        JSON.stringify({ 
          rateLimited: true, 
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: windowMs
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Record this request
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        rate_key: key,
        action: action,
        created_at: now.toISOString()
      });

    if (insertError) {
      console.error('Error recording request:', insertError);
      // Don't fail the request if we can't record it, just log it
    }

    console.log(`Rate limit check passed for key: ${key}, count: ${currentCount + 1}/${maxRequests}`);

    return new Response(
      JSON.stringify({ 
        rateLimited: false, 
        currentCount: currentCount + 1,
        maxRequests: maxRequests 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});