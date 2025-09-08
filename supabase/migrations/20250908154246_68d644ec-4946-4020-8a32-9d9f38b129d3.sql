-- Create user_interactions table for ML training and analytics
CREATE TABLE public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'share', 'comment', 'skip')),
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own interactions" 
ON public.user_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interactions" 
ON public.user_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_interactions_user_post ON public.user_interactions(user_id, post_id);
CREATE INDEX idx_user_interactions_created_at ON public.user_interactions(created_at);

-- Create feed_preferences table for user customization
CREATE TABLE public.feed_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_content_types TEXT[] DEFAULT ARRAY['text', 'image', 'video'],
  engagement_weight DECIMAL(3,2) DEFAULT 0.3,
  freshness_weight DECIMAL(3,2) DEFAULT 0.4,
  diversity_weight DECIMAL(3,2) DEFAULT 0.2,
  personalization_weight DECIMAL(3,2) DEFAULT 0.1,
  show_injected_content BOOLEAN DEFAULT true,
  auto_refresh_interval INTEGER DEFAULT 30000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feed_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own feed preferences" 
ON public.feed_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_feed_preferences_updated_at
BEFORE UPDATE ON public.feed_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();