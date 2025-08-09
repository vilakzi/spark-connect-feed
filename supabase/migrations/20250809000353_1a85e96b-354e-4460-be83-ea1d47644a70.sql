-- Storage policies for posts bucket to enable media uploads
-- Allow public read access to objects in the 'posts' bucket (useful for listing via API; CDN reads are already public)
CREATE POLICY IF NOT EXISTS "Public can read posts bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posts');

-- Allow authenticated users to upload to the 'posts' bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can upload to posts bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');
