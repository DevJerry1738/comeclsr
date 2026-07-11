-- 20260616160000_get_online_agents_rpc.sql
-- Create RPC to fetch currently online agents (heartbeat in last 1 minute)

CREATE OR REPLACE FUNCTION public.get_online_agents()
RETURNS TABLE (
  agent_id BIGINT,
  display_name VARCHAR,
  profile_photo TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS agent_id,
    CAST(COALESCE(up.full_name, a.display_name) AS VARCHAR) AS display_name,
    up.profile_photo
  FROM public.agents a
  LEFT JOIN public.user_profiles up ON a.user_id = up.id
  WHERE a.status = 'active'
    AND a.last_seen_at IS NOT NULL
    AND a.last_seen_at > NOW() - INTERVAL '1 minute'
  ORDER BY display_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_online_agents() TO authenticated;
