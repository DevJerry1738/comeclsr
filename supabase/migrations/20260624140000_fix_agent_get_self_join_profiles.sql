-- 20260624140000_fix_agent_get_self_join_profiles.sql
-- agent_get_self was only reading from the agents table (display_name, profile_photo)
-- but agent_update_self_profile writes to user_profiles (full_name, profile_photo, age, location, bio, interests).
-- This migration makes agent_get_self join both tables so the profile page loads correct data.

DROP FUNCTION IF EXISTS public.agent_get_self();

CREATE OR REPLACE FUNCTION public.agent_get_self()
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  display_name VARCHAR,
  username VARCHAR,
  full_name TEXT,
  profile_photo TEXT,
  age INT,
  location TEXT,
  bio TEXT,
  interests TEXT,
  status TEXT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.user_id,
    a.display_name,
    a.username,
    -- Prefer user_profiles.full_name, fall back to agents.display_name
    COALESCE(up.full_name, a.display_name::TEXT)  AS full_name,
    -- Prefer user_profiles.profile_photo, fall back to agents.profile_photo
    COALESCE(up.profile_photo, a.profile_photo)    AS profile_photo,
    up.age,
    up.location,
    COALESCE(up.bio, a.bio)                        AS bio,
    up.interests,
    a.status
  FROM public.agents a
  LEFT JOIN public.user_profiles up ON up.id = a.user_id
  WHERE a.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.agent_get_self() TO authenticated;
