-- Enhanced Live Streaming & Real-time Features for Phase 5

-- Add columns to live_streams table for enhanced functionality
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS category text DEFAULT 'Just Chatting';
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS price_per_minute integer DEFAULT 0;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS max_viewers integer DEFAULT NULL;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS stream_key text DEFAULT NULL;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS quality_settings jsonb DEFAULT '{"resolution": "720p", "bitrate": 2500, "fps": 30}';

-- Create stream_analytics table for performance tracking
CREATE TABLE public.stream_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  concurrent_viewers integer NOT NULL DEFAULT 0,
  total_viewers integer NOT NULL DEFAULT 0,
  chat_messages_count integer DEFAULT 0,
  tips_received_count integer DEFAULT 0,
  tips_total_amount integer DEFAULT 0,
  stream_quality jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on stream_analytics
ALTER TABLE public.stream_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for stream_analytics
CREATE POLICY "Creators can view their own stream analytics"
ON public.stream_analytics
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.live_streams ls 
  WHERE ls.id = stream_analytics.stream_id 
  AND ls.creator_id = auth.uid()
));

CREATE POLICY "System can insert stream analytics"
ON public.stream_analytics
FOR INSERT
WITH CHECK (true);

-- Create stream_tips table for monetization
CREATE TABLE public.stream_tips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  tipper_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  message text,
  is_anonymous boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on stream_tips
ALTER TABLE public.stream_tips ENABLE ROW LEVEL SECURITY;

-- Create policies for stream_tips
CREATE POLICY "Users can create tips"
ON public.stream_tips
FOR INSERT
WITH CHECK (auth.uid() = tipper_id);

CREATE POLICY "Creators can view tips for their streams"
ON public.stream_tips
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.live_streams ls 
  WHERE ls.id = stream_tips.stream_id 
  AND ls.creator_id = auth.uid()
));

CREATE POLICY "Tippers can view their own tips"
ON public.stream_tips
FOR SELECT
USING (auth.uid() = tipper_id);

-- Create stream_chat table for enhanced chat functionality
CREATE TABLE public.stream_chat (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  message_type text DEFAULT 'message' CHECK (message_type IN ('message', 'tip', 'join', 'leave', 'system', 'emoji_reaction')),
  metadata jsonb DEFAULT '{}',
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on stream_chat
ALTER TABLE public.stream_chat ENABLE ROW LEVEL SECURITY;

-- Create policies for stream_chat
CREATE POLICY "Users can send chat messages"
ON public.stream_chat
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view chat for public streams"
ON public.stream_chat
FOR SELECT
USING (
  NOT is_deleted AND
  EXISTS (
    SELECT 1 FROM public.live_streams ls 
    WHERE ls.id = stream_chat.stream_id 
    AND (ls.creator_id = auth.uid() OR NOT ls.is_private)
  )
);

CREATE POLICY "Creators can moderate chat in their streams"
ON public.stream_chat
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.live_streams ls 
  WHERE ls.id = stream_chat.stream_id 
  AND ls.creator_id = auth.uid()
));

-- Create stream_reactions table for real-time reactions
CREATE TABLE public.stream_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('heart', 'fire', 'wow', 'laugh', 'sad', 'angry')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on stream_reactions
ALTER TABLE public.stream_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for stream_reactions
CREATE POLICY "Users can create reactions"
ON public.stream_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view reactions for accessible streams"
ON public.stream_reactions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.live_streams ls 
  WHERE ls.id = stream_reactions.stream_id 
  AND (ls.creator_id = auth.uid() OR NOT ls.is_private)
));

-- Create stream_viewers table for tracking current viewers
CREATE TABLE public.stream_viewers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(stream_id, user_id)
);

-- Enable RLS on stream_viewers
ALTER TABLE public.stream_viewers ENABLE ROW LEVEL SECURITY;

-- Create policies for stream_viewers
CREATE POLICY "Users can manage their own viewer status"
ON public.stream_viewers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can view viewers of their streams"
ON public.stream_viewers
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.live_streams ls 
  WHERE ls.id = stream_viewers.stream_id 
  AND ls.creator_id = auth.uid()
));

-- Create stream_polls table for interactive polls
CREATE TABLE public.stream_polls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]', -- Array of poll options
  votes jsonb DEFAULT '{}', -- Object mapping user_id to option_index
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on stream_polls
ALTER TABLE public.stream_polls ENABLE ROW LEVEL SECURITY;

-- Create policies for stream_polls
CREATE POLICY "Creators can manage polls in their streams"
ON public.stream_polls
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.live_streams ls 
  WHERE ls.id = stream_polls.stream_id 
  AND ls.creator_id = auth.uid()
))
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view and vote on polls for accessible streams"
ON public.stream_polls
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.live_streams ls 
  WHERE ls.id = stream_polls.stream_id 
  AND (ls.creator_id = auth.uid() OR NOT ls.is_private)
));

CREATE POLICY "Users can update polls to vote"
ON public.stream_polls
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.live_streams ls 
  WHERE ls.id = stream_polls.stream_id 
  AND (ls.creator_id = auth.uid() OR NOT ls.is_private)
));

-- Create indexes for better performance
CREATE INDEX idx_stream_analytics_stream_id ON public.stream_analytics(stream_id);
CREATE INDEX idx_stream_analytics_timestamp ON public.stream_analytics(timestamp);
CREATE INDEX idx_stream_tips_stream_id ON public.stream_tips(stream_id);
CREATE INDEX idx_stream_tips_created_at ON public.stream_tips(created_at);
CREATE INDEX idx_stream_chat_stream_id ON public.stream_chat(stream_id);
CREATE INDEX idx_stream_chat_created_at ON public.stream_chat(created_at);
CREATE INDEX idx_stream_reactions_stream_id ON public.stream_reactions(stream_id);
CREATE INDEX idx_stream_viewers_stream_id ON public.stream_viewers(stream_id);
CREATE INDEX idx_stream_viewers_last_seen ON public.stream_viewers(last_seen);
CREATE INDEX idx_stream_polls_stream_id ON public.stream_polls(stream_id);
CREATE INDEX idx_live_streams_category ON public.live_streams(category);
CREATE INDEX idx_live_streams_is_private ON public.live_streams(is_private);
CREATE INDEX idx_live_streams_is_live ON public.live_streams(is_live);

-- Create function to update stream viewer count
CREATE OR REPLACE FUNCTION public.update_stream_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update viewer_count in live_streams table
  UPDATE public.live_streams 
  SET viewer_count = (
    SELECT COUNT(*) 
    FROM public.stream_viewers 
    WHERE stream_id = COALESCE(NEW.stream_id, OLD.stream_id)
    AND last_seen > now() - interval '30 seconds'
  )
  WHERE id = COALESCE(NEW.stream_id, OLD.stream_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update viewer count
CREATE TRIGGER update_viewer_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.stream_viewers
  FOR EACH ROW EXECUTE FUNCTION public.update_stream_viewer_count();

-- Create function to generate stream key
CREATE OR REPLACE FUNCTION public.generate_stream_key()
RETURNS text AS $$
BEGIN
  RETURN 'sk_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get live stream with analytics
CREATE OR REPLACE FUNCTION public.get_stream_with_analytics(stream_uuid uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  creator_id uuid,
  is_live boolean,
  viewer_count integer,
  category text,
  is_private boolean,
  price_per_minute integer,
  tags text[],
  created_at timestamp with time zone,
  creator_name text,
  creator_avatar text,
  total_tips integer,
  total_messages integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ls.id,
    ls.title,
    ls.description,
    ls.creator_id,
    ls.is_live,
    ls.viewer_count,
    ls.category,
    ls.is_private,
    ls.price_per_minute,
    ls.tags,
    ls.created_at,
    p.display_name as creator_name,
    p.profile_image_url as creator_avatar,
    COALESCE(tip_stats.total_tips, 0) as total_tips,
    COALESCE(chat_stats.total_messages, 0) as total_messages
  FROM public.live_streams ls
  LEFT JOIN public.profiles p ON p.user_id = ls.creator_id
  LEFT JOIN (
    SELECT st.stream_id, SUM(st.amount_cents) as total_tips
    FROM public.stream_tips st
    GROUP BY st.stream_id
  ) tip_stats ON tip_stats.stream_id = ls.id
  LEFT JOIN (
    SELECT sc.stream_id, COUNT(*) as total_messages
    FROM public.stream_chat sc
    WHERE NOT sc.is_deleted
    GROUP BY sc.stream_id
  ) chat_stats ON chat_stats.stream_id = ls.id
  WHERE ls.id = stream_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;