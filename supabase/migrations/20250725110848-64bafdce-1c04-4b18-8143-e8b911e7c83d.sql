-- Create missing matches for mutual swipes
INSERT INTO public.matches (user1_id, user2_id, is_super_like, created_at)
VALUES 
  ('13fe96a7-8953-4f40-9b8e-5d3d2dd10abe', 'baf9730f-3465-442a-a7a6-6e7649562ed1', false, '2025-05-29 07:41:58.890909+00'),
  ('13fe96a7-8953-4f40-9b8e-5d3d2dd10abe', '8d1f597f-92a6-4dae-955f-66b4009f9715', false, '2025-05-29 07:54:36.330043+00'),
  ('8d1f597f-92a6-4dae-955f-66b4009f9715', 'baf9730f-3465-442a-a7a6-6e7649562ed1', false, '2025-05-29 08:00:05.184733+00')
ON CONFLICT DO NOTHING;

-- Create conversations for all matches
INSERT INTO public.conversations (match_id, participant1_id, participant2_id)
SELECT 
  m.id,
  m.user1_id,
  m.user2_id
FROM public.matches m
WHERE NOT EXISTS (
  SELECT 1 FROM public.conversations c 
  WHERE c.match_id = m.id
);