-- Fix: agent_get_conversation_with_user returns status as VARCHAR but conversations.status is TEXT

DROP FUNCTION IF EXISTS public.agent_get_conversation_with_user(UUID);

CREATE OR REPLACE FUNCTION public.agent_get_conversation_with_user(p_user_id UUID)
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  agent_id BIGINT,
  status TEXT,
  admin_approved BOOLEAN,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_agent_id BIGINT;
BEGIN
  -- Get the agent's own ID
  SELECT agents.id INTO v_agent_id
  FROM public.agents
  WHERE agents.user_id = auth.uid()
  LIMIT 1;
  
  IF v_agent_id IS NULL THEN
    RAISE EXCEPTION 'Not an agent or agent record not found';
  END IF;

  -- Return the conversation between this agent and the specified user
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.agent_id,
    c.status,
    c.admin_approved,
    c.last_message_at,
    c.created_at
  FROM public.conversations c
  WHERE c.agent_id = v_agent_id
    AND c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.agent_get_conversation_with_user(UUID) TO authenticated;
