-- Fix missing indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id_created_at ON public.feed_posts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feed_posts_published_at ON public.feed_posts(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id_created_at ON public.user_interactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_interactions_post_id_type ON public.user_interactions(post_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_one_id ON public.conversations(participant_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two_id ON public.conversations(participant_two_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at ON public.messages(conversation_id, created_at);

-- Add missing RLS policy for profiles view
CREATE POLICY "Users can view other profiles for dating" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Fix cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_dead_rows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clean up expired sessions and old data
  DELETE FROM public.user_interactions 
  WHERE created_at < now() - INTERVAL '90 days';
  
  DELETE FROM public.audit_log 
  WHERE created_at < now() - INTERVAL '1 year';
  
  -- Clean up orphaned records
  DELETE FROM public.content_analytics 
  WHERE content_id NOT IN (SELECT id FROM public.admin_content);
END;
$$;