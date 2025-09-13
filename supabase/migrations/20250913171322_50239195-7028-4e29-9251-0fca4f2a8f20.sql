-- First, let's check and fix the revenue_analytics table structure and policies

-- Ensure the table is complete (in case it was truncated)
CREATE TABLE IF NOT EXISTS public.revenue_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    tips_revenue_cents integer DEFAULT 0,
    subscription_revenue_cents integer DEFAULT 0,
    stream_revenue_cents integer DEFAULT 0,
    content_revenue_cents integer DEFAULT 0,
    total_revenue_cents integer DEFAULT 0,
    payout_amount_cents integer DEFAULT 0,
    platform_fee_cents integer DEFAULT 0,
    transactions_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(creator_id, date)
);

-- Enable RLS on the table
ALTER TABLE public.revenue_analytics ENABLE ROW LEVEL SECURITY;

-- Drop any existing problematic policies
DROP POLICY IF EXISTS "Revenue analytics blocked" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Deny all access" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Block access" ON public.revenue_analytics;

-- Create proper RLS policies for revenue analytics
CREATE POLICY "Creators can view their own revenue analytics"
ON public.revenue_analytics
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert their own revenue analytics"
ON public.revenue_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own revenue analytics"
ON public.revenue_analytics
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Service role needs full access for system operations
CREATE POLICY "Service role can manage all revenue analytics"
ON public.revenue_analytics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can view all revenue analytics for moderation/support
CREATE POLICY "Admins can view all revenue analytics"
ON public.revenue_analytics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic updated_at
CREATE TRIGGER update_revenue_analytics_updated_at
    BEFORE UPDATE ON public.revenue_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();