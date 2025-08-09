-- Storage policies for posts bucket
CREATE POLICY "Public can read posts bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload to posts bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');
