-- Create user categories enum
CREATE TYPE public.user_category AS ENUM ('hookup', 'creator', 'viewer');

-- Add username and category fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN user_category user_category DEFAULT 'viewer',
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by UUID REFERENCES auth.users(id);

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Create referrals table for tracking
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for referrals
CREATE POLICY "Users can view their own referrals" ON public.referrals
FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" ON public.referrals
FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- Create creator_content table for premium content
CREATE TABLE public.creator_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'text', 'live')),
  media_url TEXT,
  thumbnail_url TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on creator_content
ALTER TABLE public.creator_content ENABLE ROW LEVEL SECURITY;

-- Create policies for creator_content
CREATE POLICY "Creators can manage their own content" ON public.creator_content
FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users can view public content" ON public.creator_content
FOR SELECT USING (NOT is_premium OR auth.uid() = creator_id);

-- Create live_streams table
CREATE TABLE public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stream_url TEXT,
  thumbnail_url TEXT,
  is_live BOOLEAN NOT NULL DEFAULT false,
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on live_streams
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Create policies for live_streams
CREATE POLICY "Creators can manage their own streams" ON public.live_streams
FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users can view live streams" ON public.live_streams
FOR SELECT USING (true);

-- Create subscriptions table for creator subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'basic',
  price_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(subscriber_id, creator_id)
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
FOR SELECT USING (auth.uid() = subscriber_id OR auth.uid() = creator_id);

CREATE POLICY "Users can create subscriptions" ON public.subscriptions
FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
FOR UPDATE USING (auth.uid() = subscriber_id);

-- Create function to generate unique username
CREATE OR REPLACE FUNCTION public.generate_username(display_name TEXT, user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Clean the display name to create a base username
  base_username := LOWER(REGEXP_REPLACE(display_name, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || SUBSTR(user_id::TEXT, 1, 8 - LENGTH(base_username));
  END IF;
  
  -- Limit to 20 characters
  base_username := SUBSTR(base_username, 1, 20);
  
  final_username := base_username;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := SUBSTR(base_username, 1, 20 - LENGTH(counter::TEXT)) || counter::TEXT;
  END LOOP;
  
  RETURN final_username;
END;
$$;

-- Create function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    code := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
    
    -- Check if code is unique
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Update the user profile creation trigger to include username and referral code
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_username TEXT;
  generated_referral_code TEXT;
BEGIN
  -- Generate username and referral code
  generated_username := public.generate_username(
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 
    NEW.id
  );
  generated_referral_code := public.generate_referral_code();
  
  -- Insert profile for new user
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    username, 
    referral_code,
    user_category
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    generated_username,
    generated_referral_code,
    COALESCE((NEW.raw_user_meta_data->>'user_category')::user_category, 'viewer')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    username = COALESCE(profiles.username, generated_username),
    referral_code = COALESCE(profiles.referral_code, generated_referral_code);

  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates on creator_content
CREATE TRIGGER update_creator_content_updated_at
BEFORE UPDATE ON public.creator_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on live_streams
CREATE TRIGGER update_live_streams_updated_at
BEFORE UPDATE ON public.live_streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();