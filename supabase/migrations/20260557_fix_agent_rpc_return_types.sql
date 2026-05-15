-- Migration: Fix agent RPC function return types
-- Issue: agent.id is SERIAL (INTEGER), not BIGINT - causing type mismatch errors

DROP FUNCTION IF EXISTS public.agent_get_self();
CREATE OR REPLACE FUNCTION public.agent_get_self()
RETURNS TABLE (
  id INTEGER,
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
  SELECT a.id, a.user_id, a.display_name, a.username, a.bio, a.profile_photo
  FROM public.agents a
  WHERE a.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.agent_get_self() TO authenticated;

DROP FUNCTION IF EXISTS public.agent_get_conversation_with_user(UUID);
CREATE OR REPLACE FUNCTION public.agent_get_conversation_with_user(p_user_id UUID)
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  agent_id INTEGER,
  status VARCHAR,
  admin_approved BOOLEAN,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP
) AS $$
DECLARE
  v_agent_id INTEGER;
BEGIN
  SELECT a.id INTO v_agent_id
  FROM public.agents a
  WHERE a.user_id = auth.uid()
  LIMIT 1;
  IF v_agent_id IS NULL THEN
    RAISE EXCEPTION 'Not an agent or agent record not found';
  END IF;
  RETURN QUERY
  SELECT c.id, c.user_id, c.agent_id, c.status, c.admin_approved, c.last_message_at, c.created_at
  FROM public.conversations c
  WHERE c.agent_id = v_agent_id AND c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.agent_get_conversation_with_user(UUID) TO authenticated;
