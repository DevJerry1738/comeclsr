-- Migration: Create agent_get_self RPC function
-- Purpose: Safely get the current logged-in agent's record without REST API RLS issues
-- Issue: Direct REST query to agents table returns 500 due to complex RLS policy

DROP FUNCTION IF EXISTS public.agent_get_self();

CREATE OR REPLACE FUNCTION public.agent_get_self()
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  display_name VARCHAR,
  username VARCHAR,
  bio TEXT,
  profile_photo TEXT
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
    a.bio,
    a.profile_photo
  FROM public.agents a
  WHERE a.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.agent_get_self() TO authenticated;
