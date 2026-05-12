-- Conversation RPC Functions
-- User and admin messaging functionality

-- ============================================================================
-- RPC: conversation_my_conversations
-- Returns conversations for the current authenticated user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.conversation_my_conversations(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  agent_id BIGINT,
  agent_name VARCHAR,
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
    a.display_name,
    c.status,
    c.admin_approved,
    c.last_message_at,
    c.created_at
  FROM public.conversations c
  LEFT JOIN public.agents a ON c.agent_id = a.id
  WHERE c.user_id = auth.uid()
  ORDER BY c.last_message_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: conversation_all_conversations
-- Returns all conversations (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.conversation_all_conversations(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  user_name VARCHAR,
  agent_id BIGINT,
  agent_name VARCHAR,
  status TEXT,
  admin_approved BOOLEAN,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    up.username,
    c.agent_id,
    a.display_name,
    c.status,
    c.admin_approved,
    c.last_message_at,
    c.created_at
  FROM public.conversations c
  LEFT JOIN public.user_profiles up ON c.user_id = up.id
  LEFT JOIN public.agents a ON c.agent_id = a.id
  ORDER BY c.last_message_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: conversation_get_messages
-- Get messages in a conversation (user or admin can view)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.conversation_get_messages(p_conversation_id BIGINT)
RETURNS TABLE (
  id BIGINT,
  conversation_id BIGINT,
  sender_id UUID,
  sender_role TEXT,
  type TEXT,
  content TEXT,
  media_url TEXT,
  duration INT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  -- Check if user is admin or owner of conversation
  v_is_admin := (SELECT role = 'admin' FROM public.user_profiles WHERE id = v_user_id);

  IF NOT v_is_admin AND NOT EXISTS (
    SELECT 1 FROM public.conversations WHERE id = p_conversation_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Forbidden: You do not have access to this conversation';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.conversation_id,
    m.sender_id,
    m.sender_role,
    m.type,
    m.content,
    m.media_url,
    m.duration,
    m.is_read,
    m.created_at
  FROM public.messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: conversation_send_message
-- Send a message in a conversation (user or agent/admin can send)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.conversation_send_message(
  p_conversation_id BIGINT,
  p_content TEXT DEFAULT NULL,
  p_message_type TEXT DEFAULT 'media',
  p_media_url TEXT DEFAULT NULL,
  p_duration INT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_sender_id UUID;
  v_sender_role TEXT;
  v_message_id BIGINT;
  v_result jsonb;
BEGIN
  v_sender_id := auth.uid();
  
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  -- Get sender role
  SELECT role INTO v_sender_role FROM public.user_profiles WHERE id = v_sender_id;
  
  IF v_sender_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Verify sender has access to conversation
  IF v_sender_role = 'user' THEN
    IF NOT EXISTS (SELECT 1 FROM public.conversations WHERE id = p_conversation_id AND user_id = v_sender_id) THEN
      RAISE EXCEPTION 'Forbidden: You do not have access to this conversation';
    END IF;
  ELSIF v_sender_role NOT IN ('admin', 'agent') THEN
    RAISE EXCEPTION 'Forbidden: Invalid role';
  END IF;

  -- Insert message
  INSERT INTO public.messages (conversation_id, sender_id, sender_role, type, content, media_url, duration)
  VALUES (p_conversation_id, v_sender_id, v_sender_role, p_message_type, p_content, p_media_url, p_duration)
  RETURNING id INTO v_message_id;

  -- Update conversation last_message_at
  UPDATE public.conversations SET last_message_at = NOW() WHERE id = p_conversation_id;

  -- Return message
  SELECT to_jsonb(public.messages.*) INTO v_result
  FROM public.messages
  WHERE id = v_message_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: conversation_mark_read
-- Mark messages in conversation as read
-- ============================================================================
CREATE OR REPLACE FUNCTION public.conversation_mark_read(p_conversation_id BIGINT)
RETURNS jsonb AS $$
DECLARE
  v_user_id UUID;
  v_updated_count INT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  -- Verify user owns conversation
  IF NOT EXISTS (SELECT 1 FROM public.conversations WHERE id = p_conversation_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Forbidden: You do not have access to this conversation';
  END IF;

  -- Mark all messages as read
  UPDATE public.messages
  SET is_read = true
  WHERE conversation_id = p_conversation_id AND is_read = false;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'messages_marked_read', v_updated_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
