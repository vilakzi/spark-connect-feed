-- Drop the insecure policy that allows viewing all posts
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;

-- Add privacy_level column to posts for granular post-level privacy control
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private'));

-- Create index for better performance on privacy queries
CREATE INDEX IF NOT EXISTS idx_posts_privacy_level ON public.posts(privacy_level);
CREATE INDEX IF NOT EXISTS idx_posts_user_privacy ON public.posts(user_id, privacy_level);

-- Create a relationships table to track friendships/followers for privacy
CREATE TABLE IF NOT EXISTS public.user_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'follow' CHECK (relationship_type IN ('follow', 'friend', 'block')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on relationships table
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for relationships
CREATE POLICY "Users can view their own relationships" ON public.user_relationships FOR SELECT 
USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can create relationships they're part of" ON public.user_relationships FOR INSERT 
WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can update their own relationships" ON public.user_relationships FOR UPDATE 
USING (follower_id = auth.uid());

CREATE POLICY "Users can delete their own relationships" ON public.user_relationships FOR DELETE 
USING (follower_id = auth.uid());

-- Create security definer function to check if user can view a post
CREATE OR REPLACE FUNCTION public.can_view_post(post_user_id UUID, post_privacy_level TEXT, viewer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_is_public BOOLEAN DEFAULT true;
  is_friend BOOLEAN DEFAULT false;
  is_blocked BOOLEAN DEFAULT false;
BEGIN
  -- Users can always view their own posts
  IF post_user_id = viewer_id THEN
    RETURN true;
  END IF;
  
  -- Check if viewer is blocked by post owner
  SELECT EXISTS(
    SELECT 1 FROM public.user_relationships 
    WHERE follower_id = post_user_id 
    AND following_id = viewer_id 
    AND relationship_type = 'block'
  ) INTO is_blocked;
  
  IF is_blocked THEN
    RETURN false;
  END IF;
  
  -- Check the post's privacy level
  CASE post_privacy_level
    WHEN 'private' THEN
      -- Only the owner can see private posts
      RETURN false;
    
    WHEN 'friends' THEN
      -- Check if viewer is a friend/follower
      SELECT EXISTS(
        SELECT 1 FROM public.user_relationships 
        WHERE follower_id = viewer_id 
        AND following_id = post_user_id 
        AND relationship_type IN ('follow', 'friend')
      ) INTO is_friend;
      
      RETURN is_friend;
    
    WHEN 'public' THEN
      -- For public posts, also check if the user's profile allows public viewing
      SELECT COALESCE((privacy_settings->>'is_public')::boolean, true) INTO profile_is_public
      FROM public.profiles 
      WHERE user_id = post_user_id;
      
      RETURN profile_is_public;
    
    ELSE
      -- Default case (should not happen with CHECK constraint)
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create secure RLS policy for posts
CREATE POLICY "Users can view posts based on privacy settings" 
ON public.posts 
FOR SELECT 
USING (
  -- Always allow viewing own posts
  auth.uid() = user_id 
  OR 
  -- Check privacy settings for other users' posts
  public.can_view_post(user_id, privacy_level, auth.uid())
);

-- Update existing posts to have default privacy settings
-- Set to 'public' for backward compatibility, but users can change this
UPDATE public.posts 
SET privacy_level = 'public' 
WHERE privacy_level IS NULL;

-- Create function to get posts with proper privacy filtering for feeds
CREATE OR REPLACE FUNCTION public.get_feed_posts(viewer_id UUID, limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  media_type TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  privacy_level TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_display_name TEXT,
  author_profile_image TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.video_url,
    p.media_type,
    p.likes_count,
    p.comments_count,
    p.shares_count,
    p.privacy_level,
    p.created_at,
    p.updated_at,
    pr.display_name,
    pr.profile_image_url
  FROM public.posts p
  LEFT JOIN public.profiles pr ON pr.user_id = p.user_id
  WHERE 
    -- Use the same privacy logic as the RLS policy
    (p.user_id = viewer_id OR public.can_view_post(p.user_id, p.privacy_level, viewer_id))
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create indexes for the relationships table
CREATE INDEX IF NOT EXISTS idx_user_relationships_follower ON public.user_relationships(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_following ON public.user_relationships(following_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_type ON public.user_relationships(relationship_type);