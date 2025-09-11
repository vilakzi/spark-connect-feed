-- Create rate_limits table for server-side rate limiting
CREATE TABLE public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rate_key text NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient cleanup and queries
CREATE INDEX idx_rate_limits_key_created ON public.rate_limits (rate_key, created_at);
CREATE INDEX idx_rate_limits_created ON public.rate_limits (created_at);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limits (no user access needed)
CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (false) 
WITH CHECK (false);