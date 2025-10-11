-- Fix storage bucket security
-- Make buckets private instead of public
UPDATE storage.buckets 
SET public = false 
WHERE name IN ('profiles', 'posts');

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view posts media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post media" ON storage.objects;

-- Create RLS policies for profiles bucket
CREATE POLICY "Users can view their own profile images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create RLS policies for posts bucket
CREATE POLICY "Users can view posts media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'posts'
  AND (
    -- Users can view their own posts
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Users can view posts from non-private posts
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id::text = (storage.foldername(name))[2]
      AND (p.user_id = auth.uid() OR public.can_view_post(p.user_id, p.privacy_level, auth.uid()))
    )
  )
);

CREATE POLICY "Users can upload their own post media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own post media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add database-level length constraints for key tables
DO $$ 
BEGIN
  -- Add constraint to messages table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_content_length'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_content_length CHECK (char_length(content) <= 1000);
  END IF;

  -- Add constraint to posts table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_content_length'
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_content_length CHECK (char_length(content) <= 5000);
  END IF;

  -- Add constraints to communities table if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communities_name_length'
  ) THEN
    ALTER TABLE public.communities
    ADD CONSTRAINT communities_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communities_description_length'
  ) THEN
    ALTER TABLE public.communities
    ADD CONSTRAINT communities_description_length CHECK (char_length(description) <= 500);
  END IF;

  -- Add constraint to stream_chat table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stream_chat_message_length'
  ) THEN
    ALTER TABLE public.stream_chat
    ADD CONSTRAINT stream_chat_message_length CHECK (char_length(message) <= 1000);
  END IF;
END $$;