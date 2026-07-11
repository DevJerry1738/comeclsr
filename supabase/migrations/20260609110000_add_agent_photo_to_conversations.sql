-- Add agent_profile_photo to conversation_my_conversations return type
-- so the Messages page can render agent avatars

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
  status TEXT,
  admin_approved BOOLEAN,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
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
    c.status,
    c.admin_approved,
    c.last_message_at,
    c.created_at
  FROM public.conversations c
  LEFT JOIN public.agents a ON c.agent_id = a.id
  LEFT JOIN public.user_profiles up ON a.user_id = up.id
  WHERE c.user_id = auth.uid()
  ORDER BY c.last_message_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.conversation_my_conversations(INT, INT) TO authenticated;
