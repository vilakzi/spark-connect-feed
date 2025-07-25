-- Phase 1: Fix Critical Database Issues - Security Functions
-- Fix function search path issues identified by linter

-- Update all functions to have proper search_path settings
ALTER FUNCTION public.log_post_payments_changes() SET search_path = 'public';
ALTER FUNCTION public.update_last_active() SET search_path = 'public';
ALTER FUNCTION public.check_and_create_match() SET search_path = 'public';
ALTER FUNCTION public.expire_matches() SET search_path = 'public';
ALTER FUNCTION public.has_role(text) SET search_path = 'public';

-- Ensure conversations and messages relationship is working
-- Add missing foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Check if foreign key exists for messages -> conversations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_conversation_id_fkey'
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_conversation_id_fkey 
        FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
    END IF;
    
    -- Check if foreign key exists for conversations -> matches
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_match_id_fkey'
        AND table_name = 'conversations'
    ) THEN
        ALTER TABLE public.conversations 
        ADD CONSTRAINT conversations_match_id_fkey 
        FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing trigger for updating conversation last message
DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON public.messages;
CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_last_message();

-- Ensure admin content is accessible to all authenticated users
-- Update RLS policy to be more permissive for approved content
DROP POLICY IF EXISTS "Users can view published and approved content" ON public.admin_content;
CREATE POLICY "Users can view all approved admin content" ON public.admin_content
    FOR SELECT USING (
        (status = 'published' AND approval_status = 'approved') OR 
        (auth.uid() IS NOT NULL AND status = 'published')
    );

-- Ensure posts are visible to all authenticated users when paid and active
DROP POLICY IF EXISTS "secure_posts_view" ON public.posts;
CREATE POLICY "Users can view active paid posts" ON public.posts
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        payment_status = 'paid' AND 
        expires_at > now()
    );