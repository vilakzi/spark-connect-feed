-- Safely create storage policies for the 'posts' bucket
DO $$
BEGIN
  -- Public read policy (for API listing; CDN reads are already public)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public can read posts bucket'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Public can read posts bucket"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'posts');
    $$;
  END IF;

  -- Authenticated upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated users can upload to posts bucket'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Authenticated users can upload to posts bucket"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');
    $$;
  END IF;
END $$;