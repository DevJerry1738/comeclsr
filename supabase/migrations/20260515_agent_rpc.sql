-- Agent RPC Functions
-- Agent management for admin users

-- ============================================================================
-- RPC: agent_list
-- Returns paginated list of all agents with their details
-- ============================================================================
CREATE OR REPLACE FUNCTION public.agent_list(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  username VARCHAR,
  display_name VARCHAR,
  profile_photo TEXT,
  bio TEXT,
  status TEXT,
  assigned_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Admin only
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.user_id,
    a.username,
    a.display_name,
    a.profile_photo,
    a.bio,
    a.status,
    a.assigned_user_id,
    a.created_at
  FROM public.agents a
  ORDER BY a.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: agent_create
-- Create a new agent (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.agent_create(
  p_user_id UUID,
  p_username VARCHAR,
  p_display_name VARCHAR,
  p_bio TEXT DEFAULT NULL,
  p_profile_photo TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_agent_id BIGINT;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  INSERT INTO public.agents (user_id, username, display_name, bio, profile_photo)
  VALUES (p_user_id, p_username, p_display_name, p_bio, p_profile_photo)
  RETURNING id INTO v_agent_id;

  SELECT to_jsonb(public.agents.*) INTO v_result
  FROM public.agents
  WHERE id = v_agent_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: agent_assign_to_user
-- Assign an agent to a user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.agent_assign_to_user(
  p_agent_id BIGINT,
  p_user_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  UPDATE public.agents
  SET assigned_user_id = p_user_id, updated_at = NOW()
  WHERE id = p_agent_id
  RETURNING to_jsonb(public.agents.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Agent not found';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: agent_approve_conversation
-- Admin approves a conversation between user and agent
-- ============================================================================
CREATE OR REPLACE FUNCTION public.agent_approve_conversation(p_conversation_id BIGINT)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  UPDATE public.conversations
  SET admin_approved = true
  WHERE id = p_conversation_id
  RETURNING to_jsonb(public.conversations.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: agent_stop_conversation
-- Admin stops/archives a conversation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.agent_stop_conversation(p_conversation_id BIGINT)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  UPDATE public.conversations
  SET status = 'stopped'
  WHERE id = p_conversation_id
  RETURNING to_jsonb(public.conversations.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: agent_set_welcome_message
-- Set welcome message for an agent
-- ============================================================================
CREATE OR REPLACE FUNCTION public.agent_set_welcome_message(
  p_agent_id BIGINT,
  p_message TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_msg_id BIGINT;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  INSERT INTO public.agent_messages (agent_id, content, is_default)
  VALUES (p_agent_id, p_message, true)
  RETURNING id INTO v_msg_id;

  SELECT to_jsonb(public.agent_messages.*) INTO v_result
  FROM public.agent_messages
  WHERE id = v_msg_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: agent_get_welcome_messages
-- Fetch all agent welcome messages (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.agent_get_welcome_messages()
RETURNS TABLE (
  id BIGINT,
  agent_id BIGINT,
  content TEXT,
  is_default BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    am.id,
    am.agent_id,
    am.content,
    am.is_default,
    am.created_at
  FROM public.agent_messages am
  WHERE am.is_default = true
  ORDER BY am.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
