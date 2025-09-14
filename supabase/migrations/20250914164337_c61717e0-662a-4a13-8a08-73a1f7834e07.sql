-- Fix revenue_analytics table RLS policies to prevent financial data exposure
-- Remove the conflicting blanket denial policy that breaks legitimate access

-- Drop the problematic "Deny unauthorized revenue analytics access" policy
-- This policy blocks ALL operations which conflicts with legitimate creator access
DROP POLICY IF EXISTS "Deny unauthorized revenue analytics access" ON public.revenue_analytics;

-- Ensure we have proper restrictive policies in place
-- Drop and recreate policies to ensure they are secure and consistent

-- Drop existing policies to recreate them with proper security
DROP POLICY IF EXISTS "Creators can view own revenue analytics only" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Creators can view their own revenue analytics" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Creators can insert their own revenue analytics" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Creators can update their own revenue analytics" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Admins can view all revenue analytics" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Service role can manage all revenue analytics" ON public.revenue_analytics;

-- Create secure, non-conflicting policies for revenue_analytics

-- Creators can only view their own revenue data
CREATE POLICY "Creators can view their own revenue analytics"
ON public.revenue_analytics
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id AND creator_id IS NOT NULL);

-- Creators can only insert their own revenue data
CREATE POLICY "Creators can insert their own revenue analytics"
ON public.revenue_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id AND creator_id IS NOT NULL);

-- Creators can only update their own revenue data
CREATE POLICY "Creators can update their own revenue analytics"
ON public.revenue_analytics
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id AND creator_id IS NOT NULL)
WITH CHECK (auth.uid() = creator_id AND creator_id IS NOT NULL);

-- Admins can view all revenue analytics for moderation/support purposes
CREATE POLICY "Admins can view all revenue analytics"
ON public.revenue_analytics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can manage all revenue analytics for system operations
CREATE POLICY "Service role can manage all revenue analytics"
ON public.revenue_analytics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.revenue_analytics ENABLE ROW LEVEL SECURITY;

-- Add audit trigger for revenue analytics modifications (security monitoring)
DROP TRIGGER IF EXISTS audit_revenue_analytics_access ON public.revenue_analytics;
CREATE TRIGGER audit_revenue_analytics_access
    AFTER INSERT OR UPDATE OR DELETE ON public.revenue_analytics
    FOR EACH ROW EXECUTE FUNCTION public.audit_security_action();