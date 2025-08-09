-- Enable realtime for live feed tables safely and idempotently
-- 1) Ensure full row data is emitted for updates
ALTER TABLE public.feed_posts REPLICA IDENTITY FULL;
ALTER TABLE public.user_interactions REPLICA IDENTITY FULL;

-- 2) Add tables to the supabase_realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'feed_posts'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_interactions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_interactions';
  END IF;
END $$;