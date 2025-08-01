-- Fix security warnings by setting proper search paths for functions

-- Update update_post_engagement_score function with proper search path
CREATE OR REPLACE FUNCTION public.update_post_engagement_score(post_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_engagement INTEGER;
  weighted_score FLOAT;
  time_decay FLOAT;
  post_age INTERVAL;
BEGIN
  -- Calculate weighted engagement score
  SELECT 
    COALESCE(SUM(CASE 
      WHEN interaction_type = 'like' THEN 1
      WHEN interaction_type = 'comment' THEN 3
      WHEN interaction_type = 'share' THEN 5
      WHEN interaction_type = 'view' THEN 0.1
      ELSE 0
    END), 0)
  INTO weighted_score
  FROM public.user_interactions 
  WHERE post_id = post_id_param 
  AND created_at > now() - INTERVAL '7 days';
  
  -- Calculate time decay (newer posts get higher scores)
  SELECT age(now(), created_at) INTO post_age
  FROM public.feed_posts WHERE id = post_id_param;
  
  time_decay := GREATEST(0.1, 1.0 - (EXTRACT(epoch FROM post_age) / 86400.0 / 7.0));
  
  -- Update engagement score
  UPDATE public.feed_posts 
  SET 
    engagement_score = weighted_score * time_decay,
    updated_at = now()
  WHERE id = post_id_param;
END;
$$;

-- Update get_personalized_feed function with proper search path
CREATE OR REPLACE FUNCTION public.get_personalized_feed(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 20,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE(
  post_id UUID,
  content TEXT,
  media_urls TEXT[],
  media_types TEXT[],
  thumbnails TEXT[],
  user_display_name TEXT,
  user_avatar TEXT,
  like_count INTEGER,
  comment_count INTEGER,
  share_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  relevance_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_preferences RECORD;
BEGIN
  -- Get user preferences or defaults
  SELECT * INTO user_preferences
  FROM public.user_feed_preferences 
  WHERE user_id = user_id_param
  LIMIT 1;
  
  IF user_preferences IS NULL THEN
    -- Create default preferences for new user
    INSERT INTO public.user_feed_preferences (user_id)
    VALUES (user_id_param);
    
    user_preferences := ROW(
      gen_random_uuid(), user_id_param, '{}', '{}', 
      '{"like": 1.0, "comment": 2.0, "share": 3.0, "view": 0.1}',
      0.5, 0.7, now(), now()
    );
  END IF;
  
  RETURN QUERY
  SELECT 
    fp.id as post_id,
    fp.content,
    fp.media_urls,
    fp.media_types,
    fp.thumbnails,
    p.display_name as user_display_name,
    p.profile_image_url as user_avatar,
    fp.like_count,
    fp.comment_count,
    fp.share_count,
    fp.created_at,
    -- Calculate relevance score
    (
      -- Base engagement score
      fp.engagement_score * 0.4 +
      -- Freshness score
      (1.0 - EXTRACT(epoch FROM age(now(), fp.created_at)) / 86400.0 / 7.0) * user_preferences.freshness_preference * 0.3 +
      -- User interaction history (higher for users we interact with)
      COALESCE((
        SELECT COUNT(*) * 0.1
        FROM public.user_interactions ui
        WHERE ui.user_id = user_id_param 
        AND ui.post_id IN (
          SELECT id FROM public.feed_posts WHERE user_id = fp.user_id
        )
        LIMIT 10
      ), 0) * 0.2 +
      -- Random factor for diversity
      RANDOM() * user_preferences.diversity_preference * 0.1
    ) as relevance_score
  FROM public.feed_posts fp
  JOIN public.profiles p ON fp.user_id = p.id
  WHERE 
    fp.published_at IS NOT NULL
    AND fp.is_draft = false
    AND (
      fp.privacy_level = 'public' 
      OR fp.user_id = user_id_param
      OR (fp.privacy_level = 'friends' AND EXISTS (
        SELECT 1 FROM public.matches 
        WHERE (user1_id = user_id_param AND user2_id = fp.user_id)
        OR (user2_id = user_id_param AND user1_id = fp.user_id)
      ))
    )
    AND fp.user_id NOT IN (
      SELECT blocked_id FROM public.blocked_users WHERE blocker_id = user_id_param
    )
  ORDER BY relevance_score DESC, fp.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Update track_user_interaction function with proper search path
CREATE OR REPLACE FUNCTION public.track_user_interaction(
  p_user_id UUID,
  p_post_id UUID,
  p_interaction_type TEXT,
  p_duration INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert interaction
  INSERT INTO public.user_interactions (
    user_id, post_id, interaction_type, duration, metadata
  ) VALUES (
    p_user_id, p_post_id, p_interaction_type, p_duration, p_metadata
  )
  ON CONFLICT (user_id, post_id, interaction_type) 
  DO UPDATE SET 
    created_at = now(),
    duration = EXCLUDED.duration,
    metadata = EXCLUDED.metadata;
  
  -- Update post counters
  IF p_interaction_type = 'like' THEN
    UPDATE public.feed_posts 
    SET like_count = like_count + 1 
    WHERE id = p_post_id;
  ELSIF p_interaction_type = 'comment' THEN
    UPDATE public.feed_posts 
    SET comment_count = comment_count + 1 
    WHERE id = p_post_id;
  ELSIF p_interaction_type = 'share' THEN
    UPDATE public.feed_posts 
    SET share_count = share_count + 1 
    WHERE id = p_post_id;
  ELSIF p_interaction_type = 'view' THEN
    UPDATE public.feed_posts 
    SET view_count = view_count + 1 
    WHERE id = p_post_id;
  END IF;
END;
$$;

-- Update trigger function with proper search path
CREATE OR REPLACE FUNCTION public.trigger_update_engagement_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM public.update_post_engagement_score(NEW.post_id);
  RETURN NEW;
END;
$$;