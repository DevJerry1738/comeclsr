-- Fix: column reference "id" is ambiguous in agent_get_user_notes
-- PostgreSQL confuses the RETURNS TABLE column "id" with the table column "id"
-- when both share the same name. Rename the return column to "note_id".

DROP FUNCTION IF EXISTS public.agent_get_user_notes(UUID);

CREATE OR REPLACE FUNCTION public.agent_get_user_notes(p_user_id UUID)
RETURNS TABLE (
  note_id BIGINT,
  user_id UUID,
  agent_id BIGINT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  author_display_name TEXT,
  author_profile_photo TEXT
) AS $$
DECLARE
  v_caller_id UUID;
  v_is_agent  BOOLEAN;
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  SELECT (role = 'agent') INTO v_is_agent
  FROM public.user_profiles
  WHERE user_profiles.id = v_caller_id;

  IF NOT v_is_agent THEN
    RAISE EXCEPTION 'Forbidden: Agent role required';
  END IF;

  RETURN QUERY
  SELECT
    n.id          AS note_id,
    n.user_id,
    n.agent_id,
    n.content,
    n.created_at,
    n.updated_at,
    COALESCE(up.full_name, a.display_name, 'Agent')::TEXT AS author_display_name,
    COALESCE(up.profile_photo, a.profile_photo)       AS author_profile_photo
  FROM public.agent_user_notes n
  LEFT JOIN public.agents          a  ON n.agent_id = a.id
  LEFT JOIN public.user_profiles   up ON a.user_id  = up.id
  WHERE n.user_id = p_user_id
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.agent_get_user_notes(UUID) TO authenticated;
