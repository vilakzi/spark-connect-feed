-- Fix search path for newly created functions
ALTER FUNCTION public.update_conversation_last_message() SET search_path = 'public';
ALTER FUNCTION public.create_conversation_from_match(UUID) SET search_path = 'public';