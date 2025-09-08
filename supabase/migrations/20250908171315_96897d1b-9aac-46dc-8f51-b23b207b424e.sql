-- Fix function search path security issues for Phase 5

-- Fix update_stream_viewer_count function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix generate_stream_key function  
CREATE OR REPLACE FUNCTION public.generate_stream_key()
RETURNS text AS $$
BEGIN
  RETURN 'sk_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_stream_with_analytics function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;