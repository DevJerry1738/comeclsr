-- Fix: conversation_get_messages ambiguous column reference
DROP FUNCTION IF EXISTS public.conversation_get_messages(BIGINT);

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
  v_conversation_id BIGINT;
BEGIN
  v_user_id := auth.uid();
  v_conversation_id := p_conversation_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  -- Check if user is admin or owner of conversation
  v_is_admin := (SELECT role = 'admin' FROM public.user_profiles up WHERE up.id = v_user_id);

  IF NOT v_is_admin AND NOT EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = v_conversation_id AND c.user_id = v_user_id
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
  WHERE m.conversation_id = v_conversation_id
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.conversation_get_messages(BIGINT) TO authenticated;
