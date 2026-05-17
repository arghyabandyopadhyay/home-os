-- Add OAuth-related fields to the profiles table
-- Supports: Google, GitHub, and future OAuth providers

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS auth_provider text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add CHECK constraints for field lengths
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_length CHECK (char_length(full_name) <= 255),
  ADD CONSTRAINT profiles_avatar_url_length CHECK (char_length(avatar_url) <= 2048),
  ADD CONSTRAINT profiles_auth_provider_length CHECK (char_length(auth_provider) <= 32);

-- Profile creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_full_name text;
  v_avatar_url text;
  v_provider text;
BEGIN
  -- Extract provider from app_metadata
  v_provider := NEW.raw_app_meta_data ->> 'provider';

  -- Extract display name (truncate to 255)
  v_full_name := LEFT(COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    NULL
  ), 255);

  -- Extract avatar URL (truncate to 2048)
  v_avatar_url := LEFT(COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture',
    NULL
  ), 2048);

  -- Set null for empty strings
  IF v_full_name = '' THEN v_full_name := NULL; END IF;
  IF v_avatar_url = '' THEN v_avatar_url := NULL; END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, auth_provider, metadata, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_avatar_url,
    COALESCE(v_provider, 'email'),
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger (drop first if exists for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
