-- Add Row Level Security policies for storage buckets

-- Profiles bucket policies
CREATE POLICY "Users can upload their own profile images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view profile images" 
ON storage.objects
FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can update their own profile images"
ON storage.objects  
FOR UPDATE
USING (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Posts bucket policies  
CREATE POLICY "Users can upload their own post media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view post media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posts');

CREATE POLICY "Users can update their own post media" 
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);