-- 20260624150000_fix_agent_get_self_casting.sql
-- Fix Postgres type mismatch: COALESCE(up.full_name, ...) returns character varying,
-- which must be explicitly cast to TEXT to match the RETURNS TABLE definition.

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
    COALESCE(up.full_name, a.display_name)::TEXT AS full_name,
    COALESCE(up.profile_photo, a.profile_photo)::TEXT AS profile_photo,
    up.age,
    up.location::TEXT AS location,
    COALESCE(up.bio, a.bio)::TEXT AS bio,
    up.interests::TEXT AS interests,
    a.status::TEXT AS status
  FROM public.agents a
  LEFT JOIN public.user_profiles up ON up.id = a.user_id
  WHERE a.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.agent_get_self() TO authenticated;
