-- Migration: Fix conversation_my_conversations RPC type mismatch
-- Issue: RPC declared id as BIGINT but conversations.id is SERIAL (INTEGER)
-- Also add new RPC to check for user's pending payment requests

-- ============================================================================
-- FIX: conversation_my_conversations - Change id return type from BIGINT to INTEGER
-- ============================================================================
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
-- FIX: conversation_all_conversations - Change id return type from BIGINT to INTEGER
-- ============================================================================
DROP FUNCTION IF EXISTS public.conversation_all_conversations(INT, INT);

CREATE OR REPLACE FUNCTION public.conversation_all_conversations(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
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
-- NEW RPC: payment_check_pending_for_user
-- Checks if current user has any pending payment requests
-- Returns: COUNT of pending requests (0 if none)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.payment_check_pending_for_user()
RETURNS TABLE (
  pending_count INTEGER
) AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  RETURN QUERY
  SELECT CAST(COUNT(*) AS INTEGER)
  FROM public.payment_requests
  WHERE user_id = auth.uid()
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIX: conversation_get_messages - Change id return type from BIGINT to INTEGER
-- ============================================================================
DROP FUNCTION IF EXISTS public.conversation_get_messages(BIGINT);

CREATE OR REPLACE FUNCTION public.conversation_get_messages(
  p_conversation_id BIGINT
)
RETURNS TABLE (
  id INTEGER,
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
