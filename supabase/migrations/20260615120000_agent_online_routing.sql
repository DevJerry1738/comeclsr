-- 20260615_agent_online_routing.sql
-- Add agent online presence tracking and routing triggers for unanswered messages

-- 1. Add last_seen_at to agents table
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create agent_heartbeat RPC function
CREATE OR REPLACE FUNCTION public.agent_heartbeat()
RETURNS jsonb AS $$
DECLARE
  v_agent_id BIGINT;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  -- Get agent's ID
  SELECT id INTO v_agent_id FROM public.agents WHERE user_id = auth.uid();

  IF v_agent_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Agent profile not found';
  END IF;

  UPDATE public.agents
  SET last_seen_at = NOW(), updated_at = NOW()
  WHERE id = v_agent_id
  RETURNING to_jsonb(public.agents.*) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.agent_heartbeat() TO authenticated;

-- 3. Drop and update conversation_my_conversations return type and logic
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
    (a.last_seen_at IS NOT NULL AND a.last_seen_at > NOW() - INTERVAL '1 minute') AS agent_is_online,
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

-- 4. Create conversation_reassign_to_active_agent function (accepting specific conversation ID)
DROP FUNCTION IF EXISTS public.conversation_reassign_to_active_agent();
DROP FUNCTION IF EXISTS public.conversation_reassign_to_active_agent(BIGINT);

CREATE OR REPLACE FUNCTION public.conversation_reassign_to_active_agent(p_conversation_id BIGINT)
RETURNS jsonb AS $$
DECLARE
  v_user_id UUID;
  v_old_agent_id BIGINT;
  v_old_agent_user_id UUID;
  v_new_agent_id BIGINT;
  v_new_agent_user_id UUID;
  v_new_agent_name VARCHAR;
  v_new_agent_photo TEXT;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  -- Find the specific active conversation for this user
  SELECT agent_id INTO v_old_agent_id
  FROM public.conversations
  WHERE id = p_conversation_id AND user_id = v_user_id AND status = 'active';

  IF v_old_agent_id IS NULL THEN
    RAISE EXCEPTION 'Active conversation not found or access denied';
  END IF;

  -- Get old agent's user_id
  SELECT user_id INTO v_old_agent_user_id
  FROM public.agents
  WHERE id = v_old_agent_id;

  -- Find another agent who is active (heartbeat within last 1 minute) and not the old agent
  -- Order by active workload count to balance routing
  SELECT a.id, a.user_id, COALESCE(up.full_name, a.display_name), up.profile_photo
  INTO v_new_agent_id, v_new_agent_user_id, v_new_agent_name, v_new_agent_photo
  FROM public.agents a
  LEFT JOIN public.user_profiles up ON a.user_id = up.id
  WHERE a.status = 'active'
    AND a.id != v_old_agent_id
    AND a.last_seen_at IS NOT NULL
    AND a.last_seen_at > NOW() - INTERVAL '1 minute'
  ORDER BY (
    SELECT COUNT(*) FROM public.conversations c
    WHERE c.agent_id = a.id AND c.status = 'active'
  ) ASC, RANDOM()
  LIMIT 1;

  -- If no active agent is found, return error code
  IF v_new_agent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_active_agents');
  END IF;

  -- Reassign conversation to the new agent
  UPDATE public.conversations
  SET agent_id = v_new_agent_id, last_message_at = NOW()
  WHERE id = p_conversation_id;

  -- Update user's profile assigned_agent_id
  UPDATE public.user_profiles
  SET assigned_agent_id = v_new_agent_id
  WHERE id = v_user_id;

  -- Update agent_assignments
  UPDATE public.agent_assignments
  SET status = 'inactive', updated_at = NOW()
  WHERE user_id = v_user_id AND agent_id = v_old_agent_user_id AND status = 'active';

  INSERT INTO public.agent_assignments (user_id, agent_id, assigned_at, status)
  VALUES (v_user_id, v_new_agent_user_id, NOW(), 'active');

  RETURN jsonb_build_object(
    'success', true,
    'conversation_id', p_conversation_id,
    'new_agent_id', v_new_agent_id,
    'new_agent_name', v_new_agent_name,
    'new_agent_photo', v_new_agent_photo
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.conversation_reassign_to_active_agent(BIGINT) TO authenticated;
