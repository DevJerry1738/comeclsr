-- 20260616150000_safe_routing_no_close.sql
-- Fix: When reassigning a conversation because the agent is offline,
-- route the user to the active agent (retrieving the existing active conversation with them, or creating a new one).
-- Do NOT close or modify the old offline agent's conversation, so the user does not lose it from their sidebar list.

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
  v_existing_conv_id BIGINT;
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
  -- First try agents the user already has an active conversation with, to minimize creating new conversations
  SELECT a.id, a.user_id, COALESCE(up.full_name, a.display_name), up.profile_photo, c2.id
  INTO v_new_agent_id, v_new_agent_user_id, v_new_agent_name, v_new_agent_photo, v_existing_conv_id
  FROM public.agents a
  LEFT JOIN public.user_profiles up ON a.user_id = up.id
  JOIN public.conversations c2 ON c2.user_id = v_user_id AND c2.agent_id = a.id AND c2.status = 'active'
  WHERE a.status = 'active'
    AND a.id != v_old_agent_id
    AND a.last_seen_at IS NOT NULL
    AND a.last_seen_at > NOW() - INTERVAL '1 minute'
  ORDER BY (
    SELECT COUNT(*) FROM public.conversations c
    WHERE c.agent_id = a.id AND c.status = 'active'
  ) ASC, RANDOM()
  LIMIT 1;

  -- If no active agent with existing conversation found, try agents WITHOUT existing conversations
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

  IF v_existing_conv_id IS NOT NULL THEN
    -- User already has a conversation: just route to it, do NOT touch/close the old one
    v_final_conversation_id := v_existing_conv_id;
  ELSE
    -- No existing conversation: create a new one with the active agent
    INSERT INTO public.conversations (user_id, agent_id, status, created_at, updated_at, last_message_at)
    VALUES (v_user_id, v_new_agent_id, 'active', NOW(), NOW(), NOW())
    RETURNING id INTO v_final_conversation_id;
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
