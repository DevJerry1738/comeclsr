-- Migration: Fix duplicate users in agent dashboard (DISTINCT ON)
-- Issue: agent_get_assigned_users returned multiple rows per user due to LEFT JOIN with user_subscriptions
-- Solution: Use DISTINCT ON to get only the latest subscription per user

DROP FUNCTION IF EXISTS public.agent_get_assigned_users();

CREATE OR REPLACE FUNCTION public.agent_get_assigned_users()
RETURNS TABLE (
  user_id UUID,
  username VARCHAR,
  full_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  profile_photo TEXT,
  subscription_status TEXT,
  subscription_expires_at TIMESTAMP,
  assigned_at TIMESTAMP
) AS $$
BEGIN
  IF NOT (SELECT role = 'agent' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Agent role required';
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (up.id)
    up.id,
    up.username,
    up.full_name,
    up.email,
    up.phone,
    up.profile_photo,
    COALESCE(us.status, 'none'),
    us.expires_at,
    aa.assigned_at
  FROM public.agent_assignments aa
  JOIN public.user_profiles up ON aa.user_id = up.id
  LEFT JOIN public.user_subscriptions us ON up.id = us.user_id
  WHERE aa.agent_id = auth.uid()
  AND aa.status = 'active'
  ORDER BY up.id, us.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
