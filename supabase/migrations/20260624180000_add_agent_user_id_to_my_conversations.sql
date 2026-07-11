-- 20260624180000_add_agent_user_id_to_my_conversations.sql
-- Update conversation_my_conversations to return the agent's UUID (agent_user_id)
-- so the frontend can query their profile media gallery correctly.

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
  agent_user_id UUID
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
    a.user_id AS agent_user_id
  FROM public.conversations c
  LEFT JOIN public.agents a ON c.agent_id = a.id
  LEFT JOIN public.user_profiles up ON a.user_id = up.id
  WHERE c.user_id = auth.uid()
  ORDER BY c.last_message_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.conversation_my_conversations(INT, INT) TO authenticated;
