-- Fix remaining function search path issue
-- Update the is_new_joiner function that's still missing search_path
ALTER FUNCTION public.is_new_joiner() SET search_path = 'public';