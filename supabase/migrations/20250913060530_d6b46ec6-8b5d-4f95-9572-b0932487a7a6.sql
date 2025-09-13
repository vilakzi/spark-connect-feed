-- Create storage policies with enhanced security

-- Update profiles bucket policy for better security
DROP POLICY IF EXISTS "Allow public read access to profiles" ON storage.objects;
CREATE POLICY "Allow public read access to profiles" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profiles');

CREATE POLICY "Allow authenticated users to upload their own profile images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
);

CREATE POLICY "Allow users to update their own profile images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own profile images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update posts bucket policy for better security
DROP POLICY IF EXISTS "Allow public read access to posts" ON storage.objects;
CREATE POLICY "Allow public read access to posts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'posts');

CREATE POLICY "Allow authenticated users to upload post media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL
  AND (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi')
);

CREATE POLICY "Allow users to update their own post media" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own post media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);