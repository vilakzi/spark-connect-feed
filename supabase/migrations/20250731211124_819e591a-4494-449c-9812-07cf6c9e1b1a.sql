-- Create function to get AI matching suggestions
CREATE OR REPLACE FUNCTION get_ai_matching_suggestions(user_id_param UUID, limit_param INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  compatibility_score FLOAT,
  common_interests INTEGER,
  activity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    -- Simple compatibility score based on common interests and activity
    (
      COALESCE(
        (SELECT COUNT(*) FROM unnest(p.interests) interest 
         WHERE interest = ANY(
           SELECT unnest(up.interests) FROM profiles up WHERE up.id = user_id_param
         )
        ), 0
      )::FLOAT / GREATEST(
        array_length(p.interests, 1), 
        (SELECT array_length(interests, 1) FROM profiles WHERE id = user_id_param), 
        1
      ) * 0.6 +
      -- Activity score (recent activity gets higher score)
      CASE 
        WHEN p.last_active > now() - INTERVAL '1 day' THEN 0.4
        WHEN p.last_active > now() - INTERVAL '3 days' THEN 0.3
        WHEN p.last_active > now() - INTERVAL '7 days' THEN 0.2
        ELSE 0.1
      END
    ) as compatibility_score,
    COALESCE(
      (SELECT COUNT(*) FROM unnest(p.interests) interest 
       WHERE interest = ANY(
         SELECT unnest(up.interests) FROM profiles up WHERE up.id = user_id_param
       )
      ), 0
    )::INTEGER as common_interests,
    CASE 
      WHEN p.last_active > now() - INTERVAL '1 day' THEN 1.0
      WHEN p.last_active > now() - INTERVAL '3 days' THEN 0.75
      WHEN p.last_active > now() - INTERVAL '7 days' THEN 0.5
      ELSE 0.25
    END as activity_score
  FROM profiles p
  WHERE p.id != user_id_param
    AND p.id NOT IN (
      SELECT target_user_id FROM swipes WHERE user_id = user_id_param
    )
    AND p.id NOT IN (
      SELECT blocked_id FROM blocked_users WHERE blocker_id = user_id_param
    )
    AND p.id NOT IN (
      SELECT blocker_id FROM blocked_users WHERE blocked_id = user_id_param
    )
    AND NOT p.is_blocked
  ORDER BY compatibility_score DESC, activity_score DESC
  LIMIT limit_param;
END;
$$;