-- Migration: Create agent_get_conversation_with_user RPC function
-- Purpose: Allow agents to safely get conversation with a specific user
-- Issue: Direct REST query to conversations table fails due to RLS policies

DROP FUNCTION IF EXISTS public.agent_get_conversation_with_user(UUID);

CREATE OR REPLACE FUNCTION public.agent_get_conversation_with_user(p_user_id UUID)
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  agent_id BIGINT,
  status VARCHAR,
  admin_approved BOOLEAN,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP
) AS $$
DECLARE
  v_agent_id BIGINT;
BEGIN
  -- Get the agent's own ID
  SELECT id INTO v_agent_id
  FROM public.agents
  WHERE user_id = auth.uid()
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

-- Grant execute to authenticated users (agents only, enforced by function)
GRANT EXECUTE ON FUNCTION public.agent_get_conversation_with_user(UUID) TO authenticated;
