-- Phase 1: Fix match creation system by creating missing matches
INSERT INTO public.matches (user1_id, user2_id, is_super_like, created_at)
VALUES 
  ('13fe96a7-8953-4f40-9b8e-5d3d2dd10abe', 'baf9730f-3465-442a-a7a6-6e7649562ed1', false, '2025-05-29 07:41:58.890909+00'),
  ('13fe96a7-8953-4f40-9b8e-5d3d2dd10abe', '8d1f597f-92a6-4dae-955f-66b4009f9715', false, '2025-05-29 07:54:36.330043+00'),
  ('8d1f597f-92a6-4dae-955f-66b4009f9715', 'baf9730f-3465-442a-a7a6-6e7649562ed1', false, '2025-05-29 08:00:05.184733+00')
ON CONFLICT DO NOTHING;

-- Phase 3: Create conversations for existing matches
INSERT INTO public.conversations (match_id, participant1_id, participant2_id)
SELECT 
  m.id,
  m.user1_id,
  m.user2_id
FROM public.matches m
WHERE NOT EXISTS (
  SELECT 1 FROM public.conversations c 
  WHERE c.match_id = m.id
);

-- Enable realtime for chat tables
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.typing_indicators REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Phase 5: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_participants 
ON public.conversations (participant1_id, participant2_id);

CREATE INDEX IF NOT EXISTS idx_matches_users 
ON public.matches (user1_id, user2_id);

CREATE INDEX IF NOT EXISTS idx_swipes_user_target 
ON public.swipes (user_id, target_user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_active 
ON public.profiles (last_active DESC) WHERE NOT is_blocked;