-- Phase 1: Emergency Database Function Fix
-- Fix the get_personalized_feed function to remove matches table reference

CREATE OR REPLACE FUNCTION public.get_personalized_feed(user_id_param uuid, limit_param integer DEFAULT 20, offset_param integer DEFAULT 0)
 RETURNS TABLE(post_id uuid, content text, media_urls text[], media_types text[], thumbnails text[], user_display_name text, user_avatar text, like_count integer, comment_count integer, share_count integer, created_at timestamp with time zone, relevance_score double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_preferences RECORD;
  default_freshness_preference FLOAT := 0.7;
  default_diversity_preference FLOAT := 0.5;
BEGIN
  -- Get user preferences or use defaults
  SELECT * INTO user_preferences
  FROM public.user_feed_preferences 
  WHERE user_id = user_id_param
  LIMIT 1;
  
  -- If no preferences exist, create them
  IF user_preferences IS NULL THEN
    INSERT INTO public.user_feed_preferences (
      user_id, 
      freshness_preference, 
      diversity_preference,
      content_interests,
      preferred_content_types,
      interaction_weights
    )
    VALUES (
      user_id_param,
      default_freshness_preference,
      default_diversity_preference,
      '{}',
      '{}',
      '{"like": 1.0, "comment": 2.0, "share": 3.0, "view": 0.1}'
    );
    
    -- Get the newly created preferences
    SELECT * INTO user_preferences
    FROM public.user_feed_preferences 
    WHERE user_id = user_id_param
    LIMIT 1;
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
    -- Calculate relevance score (simplified without matches table)
    (
      -- Base engagement score
      COALESCE(fp.engagement_score, 0) * 0.4 +
      -- Freshness score
      (1.0 - EXTRACT(epoch FROM age(now(), fp.created_at)) / 86400.0 / 7.0) * 
      COALESCE(user_preferences.freshness_preference, default_freshness_preference) * 0.3 +
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
      RANDOM() * COALESCE(user_preferences.diversity_preference, default_diversity_preference) * 0.1
    ) as relevance_score
  FROM public.feed_posts fp
  JOIN public.profiles p ON fp.user_id = p.id
  WHERE 
    fp.published_at IS NOT NULL
    AND fp.is_draft = false
    AND (
      fp.privacy_level = 'public' 
      OR fp.user_id = user_id_param
      -- Removed matches table dependency for now
    )
  ORDER BY relevance_score DESC, fp.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback query in case of any errors
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
      1.0 as relevance_score
    FROM public.feed_posts fp
    JOIN public.profiles p ON fp.user_id = p.id
    WHERE 
      fp.published_at IS NOT NULL
      AND fp.is_draft = false
      AND fp.privacy_level = 'public'
    ORDER BY fp.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$function$;

-- Phase 2: Security Improvements
-- Fix search_path for other functions
CREATE OR REPLACE FUNCTION public.track_user_interaction(p_user_id uuid, p_post_id uuid, p_interaction_type text, p_duration integer DEFAULT NULL::integer, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Phase 3: Data Quality - Calculate engagement scores for existing posts
CREATE OR REPLACE FUNCTION public.calculate_engagement_scores()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  post_record RECORD;
  weighted_score FLOAT;
  time_decay FLOAT;
  post_age INTERVAL;
BEGIN
  -- Update engagement scores for all posts
  FOR post_record IN 
    SELECT id, created_at FROM public.feed_posts
  LOOP
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
    WHERE post_id = post_record.id;
    
    -- Calculate time decay
    post_age := age(now(), post_record.created_at);
    time_decay := GREATEST(0.1, 1.0 - (EXTRACT(epoch FROM post_age) / 86400.0 / 7.0));
    
    -- Update engagement score
    UPDATE public.feed_posts 
    SET 
      engagement_score = weighted_score * time_decay,
      updated_at = now()
    WHERE id = post_record.id;
  END LOOP;
END;
$function$;

-- Run the engagement score calculation
SELECT public.calculate_engagement_scores();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON public.feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_engagement ON public.feed_posts(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_published ON public.feed_posts(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_interactions_post_id ON public.user_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);

-- Extract hashtags and mentions from existing content
UPDATE public.feed_posts 
SET 
  hashtags = (
    SELECT array_agg(DISTINCT lower(substring(word FROM 2)))
    FROM regexp_split_to_table(content, '\s+') AS word
    WHERE word ~ '^#[a-zA-Z0-9_]+$'
  ),
  mentions = (
    SELECT array_agg(DISTINCT lower(substring(word FROM 2)))
    FROM regexp_split_to_table(content, '\s+') AS word
    WHERE word ~ '^@[a-zA-Z0-9_]+$'
  )
WHERE content IS NOT NULL AND (hashtags IS NULL OR mentions IS NULL);