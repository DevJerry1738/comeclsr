-- 20260615b_fix_reassignment_duplicate_conversations.sql
-- Fix: When reassigning a conversation, if the user already has an existing
-- conversation with the new agent, close the old conversation and redirect
-- to the existing one instead of creating a duplicate.

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
  v_existing_conv_id INTEGER;
  v_final_conversation_id BIGINT;
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
  -- Also exclude agents the user already has an active conversation with to avoid duplicates
  SELECT a.id, a.user_id, COALESCE(up.full_name, a.display_name), up.profile_photo
  INTO v_new_agent_id, v_new_agent_user_id, v_new_agent_name, v_new_agent_photo
  FROM public.agents a
  LEFT JOIN public.user_profiles up ON a.user_id = up.id
  WHERE a.status = 'active'
    AND a.id != v_old_agent_id
    AND a.last_seen_at IS NOT NULL
    AND a.last_seen_at > NOW() - INTERVAL '1 minute'
    AND NOT EXISTS (
      SELECT 1 FROM public.conversations c2
      WHERE c2.user_id = v_user_id AND c2.agent_id = a.id AND c2.status = 'active'
    )
  ORDER BY (
    SELECT COUNT(*) FROM public.conversations c
    WHERE c.agent_id = a.id AND c.status = 'active'
  ) ASC, RANDOM()
  LIMIT 1;

  -- If no agent without existing conversation found, try agents WITH existing conversations
  -- In this case we'll redirect to the existing conversation instead of creating a duplicate
  IF v_new_agent_id IS NULL THEN
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
  END IF;

  -- If still no active agent found, return error code
  IF v_new_agent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_active_agents');
  END IF;

  -- Check if user already has an active conversation with the new agent
  SELECT id INTO v_existing_conv_id
  FROM public.conversations
  WHERE user_id = v_user_id AND agent_id = v_new_agent_id AND status = 'active'
  LIMIT 1;

  IF v_existing_conv_id IS NOT NULL THEN
    -- User already has a conversation with this agent:
    -- Close the OLD conversation (the one that timed out) and redirect to existing one
    UPDATE public.conversations
    SET status = 'closed', last_message_at = NOW()
    WHERE id = p_conversation_id;

    v_final_conversation_id := v_existing_conv_id;
  ELSE
    -- No existing conversation: reassign the old conversation to the new agent
    UPDATE public.conversations
    SET agent_id = v_new_agent_id, last_message_at = NOW()
    WHERE id = p_conversation_id;

    v_final_conversation_id := p_conversation_id;
  END IF;

  -- Update user's profile assigned_agent_id
  UPDATE public.user_profiles
  SET assigned_agent_id = v_new_agent_id
  WHERE id = v_user_id;

  -- Update agent_assignments
  UPDATE public.agent_assignments
  SET status = 'inactive', updated_at = NOW()
  WHERE user_id = v_user_id AND agent_id = v_old_agent_user_id AND status = 'active';

  -- Only create new assignment if one doesn't already exist
  INSERT INTO public.agent_assignments (user_id, agent_id, assigned_at, status)
  SELECT v_user_id, v_new_agent_user_id, NOW(), 'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.agent_assignments
    WHERE user_id = v_user_id AND agent_id = v_new_agent_user_id AND status = 'active'
  );

  RETURN jsonb_build_object(
    'success', true,
    'conversation_id', v_final_conversation_id,
    'new_agent_id', v_new_agent_id,
    'new_agent_name', v_new_agent_name,
    'new_agent_photo', v_new_agent_photo
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.conversation_reassign_to_active_agent(BIGINT) TO authenticated;
