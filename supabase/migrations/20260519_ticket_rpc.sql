-- Ticket RPC Functions
-- Support ticket management for users and admins

-- ============================================================================
-- RPC: ticket_my_tickets
-- Returns tickets created by the current user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ticket_my_tickets(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
  subject VARCHAR,
  category TEXT,
  status TEXT,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.subject,
    t.category,
    t.status,
    t.priority,
    t.created_at,
    t.updated_at
  FROM public.tickets t
  WHERE t.user_id = auth.uid()
  ORDER BY t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: ticket_all_tickets
-- Returns all tickets (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ticket_all_tickets(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  username VARCHAR,
  subject VARCHAR,
  category TEXT,
  status TEXT,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.user_id,
    up.username,
    t.subject,
    t.category,
    t.status,
    t.priority,
    t.created_at,
    t.updated_at
  FROM public.tickets t
  JOIN public.user_profiles up ON t.user_id = up.id
  ORDER BY t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: ticket_create
-- Create a new support ticket (authenticated users)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ticket_create(
  p_subject VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'general',
  p_priority TEXT DEFAULT 'medium'
)
RETURNS jsonb AS $$
DECLARE
  v_ticket_id BIGINT;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  -- First, create the ticket (description is stored in replies table)
  INSERT INTO public.tickets (user_id, subject, category, priority)
  VALUES (auth.uid(), p_subject, p_category, p_priority)
  RETURNING id INTO v_ticket_id;

  -- If description provided, create first reply as system description
  IF p_description IS NOT NULL THEN
    INSERT INTO public.ticket_replies (ticket_id, sender_id, sender_role, message)
    VALUES (v_ticket_id, auth.uid(), 'user', p_description);
  END IF;

  -- Return created ticket
  SELECT to_jsonb(public.tickets.*) INTO v_result
  FROM public.tickets
  WHERE id = v_ticket_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: ticket_reply
-- Add a reply to a ticket (user or admin)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ticket_reply(
  p_ticket_id BIGINT,
  p_reply_text TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_sender_id UUID;
  v_sender_role TEXT;
  v_reply_id BIGINT;
  v_result jsonb;
  v_user_ticket_id UUID;
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

  -- Verify access: user must own ticket or be admin
  IF v_sender_role = 'user' THEN
    SELECT user_id INTO v_user_ticket_id FROM public.tickets WHERE id = p_ticket_id;
    IF v_user_ticket_id != v_sender_id THEN
      RAISE EXCEPTION 'Forbidden: You do not have access to this ticket';
    END IF;
  ELSIF v_sender_role != 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Invalid role';
  END IF;

  -- Insert reply
  INSERT INTO public.ticket_replies (ticket_id, sender_id, sender_role, message)
  VALUES (p_ticket_id, v_sender_id, v_sender_role, p_reply_text)
  RETURNING id INTO v_reply_id;

  -- Update ticket updated_at
  UPDATE public.tickets SET updated_at = NOW() WHERE id = p_ticket_id;

  -- Return reply
  SELECT to_jsonb(public.ticket_replies.*) INTO v_result
  FROM public.ticket_replies
  WHERE id = v_reply_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: ticket_update_status
-- Update ticket status (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ticket_update_status(
  p_ticket_id BIGINT,
  p_status TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  UPDATE public.tickets
  SET status = p_status, updated_at = NOW()
  WHERE id = p_ticket_id
  RETURNING to_jsonb(public.tickets.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
