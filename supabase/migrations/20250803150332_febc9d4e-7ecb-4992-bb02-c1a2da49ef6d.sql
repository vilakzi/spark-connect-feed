-- Phase 1: Emergency Database Function Fix
-- Fix the get_personalized_feed function with proper ROW constructor and NULL handling

CREATE OR REPLACE FUNCTION public.get_personalized_feed(user_id_param uuid, limit_param integer DEFAULT 20, offset_param integer DEFAULT 0)
 RETURNS TABLE(post_id uuid, content text, media_urls text[], media_types text[], thumbnails text[], user_display_name text, user_avatar text, like_count integer, comment_count integer, share_count integer, created_at timestamp with time zone, relevance_score double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
    -- Calculate relevance score
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
      OR (fp.privacy_level = 'friends' AND EXISTS (
        SELECT 1 FROM public.matches 
        WHERE (user1_id = user_id_param AND user2_id = fp.user_id)
        OR (user2_id = user_id_param AND user1_id = fp.user_id)
      ))
    )
  ORDER BY relevance_score DESC, fp.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$function$;

-- Phase 2: Data Migration from posts to feed_posts
-- Migrate existing posts to the new feed_posts table
INSERT INTO public.feed_posts (
  user_id,
  content,
  media_urls,
  media_types,
  thumbnails,
  privacy_level,
  published_at,
  created_at,
  updated_at,
  is_draft
)
SELECT 
  provider_id as user_id,
  COALESCE(caption, 'Migrated post') as content,
  ARRAY[content_url] as media_urls,
  CASE 
    WHEN post_type = 'image' THEN ARRAY['image']
    WHEN post_type = 'video' THEN ARRAY['video']
    ELSE ARRAY['image']
  END as media_types,
  ARRAY[]::text[] as thumbnails,
  'public' as privacy_level,
  created_at as published_at,
  created_at,
  updated_at,
  false as is_draft
FROM public.posts 
WHERE payment_status = 'paid' 
AND expires_at > now()
AND NOT EXISTS (
  SELECT 1 FROM public.feed_posts 
  WHERE feed_posts.user_id = posts.provider_id 
  AND feed_posts.content = COALESCE(posts.caption, 'Migrated post')
);

-- Phase 3: Create default user preferences for all existing users
INSERT INTO public.user_feed_preferences (
  user_id,
  freshness_preference,
  diversity_preference,
  content_interests,
  preferred_content_types,
  interaction_weights
)
SELECT 
  p.id,
  0.7,
  0.5,
  '{}',
  '{}',
  '{"like": 1.0, "comment": 2.0, "share": 3.0, "view": 0.1}'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_feed_preferences ufp 
  WHERE ufp.user_id = p.id
);

-- Update engagement scores for migrated posts
UPDATE public.feed_posts 
SET engagement_score = (
  COALESCE(like_count, 0) * 1.0 + 
  COALESCE(comment_count, 0) * 2.0 + 
  COALESCE(share_count, 0) * 3.0 + 
  COALESCE(view_count, 0) * 0.1
)
WHERE engagement_score = 0;