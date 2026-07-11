-- Add a default per-agent location time difference so users can see how far away an agent is.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS location_time_difference_hours INTEGER;

DROP FUNCTION IF EXISTS public.update_agent_profile(UUID, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.update_agent_profile(
  p_agent_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_profile_photo TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_location_time_difference_hours INTEGER DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_agent_id AND role = 'agent') THEN
    RAISE EXCEPTION 'Agent not found';
  END IF;

  UPDATE public.user_profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    profile_photo = COALESCE(p_profile_photo, profile_photo),
    status = COALESCE(p_status, status),
    location_time_difference_hours = COALESCE(p_location_time_difference_hours, location_time_difference_hours),
    updated_at = NOW()
  WHERE id = p_agent_id
  RETURNING to_jsonb(public.user_profiles.*) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_agent_profile(UUID, TEXT, TEXT, TEXT, INTEGER) TO authenticated;

DROP FUNCTION IF EXISTS public.conversation_my_conversations(INT, INT);

CREATE OR REPLACE FUNCTION public.conversation_my_conversations(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  agent_id BIGINT,
  agent_name VARCHAR,
  agent_profile_photo TEXT,
  agent_is_online BOOLEAN,
  status TEXT,
  admin_approved BOOLEAN,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  agent_bio TEXT,
  agent_location TEXT,
  agent_age INT,
  agent_interests TEXT,
  agent_location_time_difference_hours INT
) AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.agent_id,
    CAST(COALESCE(up.full_name, a.display_name) AS VARCHAR) AS agent_name,
    up.profile_photo AS agent_profile_photo,
    (a.last_seen_at IS NOT NULL AND a.last_seen_at > NOW() - INTERVAL '1 minute') AS agent_is_online,
    c.status,
    c.admin_approved,
    c.last_message_at,
    c.created_at,
    COALESCE(up.bio, a.bio)::TEXT AS agent_bio,
    up.location::TEXT AS agent_location,
    up.age AS agent_age,
    up.interests::TEXT AS agent_interests,
    up.location_time_difference_hours::INT AS agent_location_time_difference_hours
  FROM public.conversations c
  LEFT JOIN public.agents a ON c.agent_id = a.id
  LEFT JOIN public.user_profiles up ON a.user_id = up.id
  WHERE c.user_id = auth.uid()
  ORDER BY c.last_message_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.conversation_my_conversations(INT, INT) TO authenticated;
