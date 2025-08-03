-- Fix remaining security warnings by adding search_path to all functions

-- Fix function search_path for trigger_update_engagement_score
CREATE OR REPLACE FUNCTION public.trigger_update_engagement_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.update_post_engagement_score(NEW.post_id);
  RETURN NEW;
END;
$function$;

-- Fix function search_path for update_post_engagement_score
CREATE OR REPLACE FUNCTION public.update_post_engagement_score(post_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
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
  
  -- Calculate time decay
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
$function$;