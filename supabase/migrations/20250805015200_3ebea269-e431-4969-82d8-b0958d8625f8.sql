-- Fix the remaining security warning for the trigger function
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mutual_like_exists BOOLEAN := false;
BEGIN
  -- Only proceed if this is a like action
  IF NEW.action_type != 'like' THEN
    RETURN NEW;
  END IF;
  
  -- Check if the target user has also liked this user
  SELECT EXISTS(
    SELECT 1 FROM public.swipe_actions 
    WHERE user_id = NEW.target_user_id 
    AND target_user_id = NEW.user_id 
    AND action_type = 'like'
  ) INTO mutual_like_exists;
  
  -- If mutual like exists, create a match
  IF mutual_like_exists THEN
    INSERT INTO public.matches (user_one_id, user_two_id, is_super_like, created_at)
    VALUES (
      LEAST(NEW.user_id, NEW.target_user_id),
      GREATEST(NEW.user_id, NEW.target_user_id),
      NEW.action_type = 'super_like',
      now()
    )
    ON CONFLICT (user_one_id, user_two_id) DO NOTHING;
    
    -- Create notifications for both users
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES 
      (NEW.user_id, 'match', 'New Match!', 'You have a new match', jsonb_build_object('match_user_id', NEW.target_user_id)),
      (NEW.target_user_id, 'match', 'New Match!', 'You have a new match', jsonb_build_object('match_user_id', NEW.user_id));
  END IF;
  
  RETURN NEW;
END;
$$;