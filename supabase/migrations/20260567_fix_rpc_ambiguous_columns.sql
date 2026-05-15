-- Migration: Fix RPC function ambiguous column references
-- Issue: Both agent_get_conversation_with_user and conversation_get_messages have ambiguous "id" references
-- This migration directly fixes the RPC functions without altering the agents table

-- Fix 1: agent_get_conversation_with_user
-- The issue: when the function selects c.id, it might be conflicting with a variable or need explicit casting
DROP FUNCTION IF EXISTS public.agent_get_conversation_with_user(UUID);

CREATE OR REPLACE FUNCTION public.agent_get_conversation_with_user(p_user_id UUID)
RETURNS TABLE (
  conversation_id BIGINT,
  user_id UUID,
  agent_id BIGINT,
  status VARCHAR,
  admin_approved BOOLEAN,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
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
    c.id AS conversation_id,
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

-- Fix 2: conversation_get_messages
-- Ensure all column references are explicitly aliased
DROP FUNCTION IF EXISTS public.conversation_get_messages(BIGINT);

CREATE OR REPLACE FUNCTION public.conversation_get_messages(p_conversation_id BIGINT)
RETURNS TABLE (
  message_id BIGINT,
  conversation_id BIGINT,
  sender_id UUID,
  sender_role TEXT,
  message_type TEXT,
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
    m.id AS message_id,
    m.conversation_id,
    m.sender_id,
    m.sender_role,
    m.type AS message_type,
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

GRANT EXECUTE ON FUNCTION public.conversation_get_messages(BIGINT) TO authenticated;
