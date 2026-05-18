-- Migration: Fix ticket_all_tickets to include replies and full user info
-- Also fix ticket_my_tickets to include replies

DROP FUNCTION IF EXISTS public.ticket_all_tickets(INT, INT);

CREATE OR REPLACE FUNCTION public.ticket_all_tickets(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS SETOF jsonb AS $$
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'id', t.id,
    'userId', t.user_id,
    'subject', t.subject,
    'category', t.category,
    'status', t.status,
    'priority', t.priority,
    'createdAt', t.created_at,
    'updatedAt', t.updated_at,
    'user', jsonb_build_object(
      'fullName', up.full_name,
      'email', up.email,
      'username', up.username
    ),
    'replies', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', tr.id,
          'message', tr.message,
          'senderRole', tr.sender_role,
          'createdAt', tr.created_at
        ) ORDER BY tr.created_at ASC
      )
      FROM public.ticket_replies tr
      WHERE tr.ticket_id = t.id
    ), '[]'::jsonb)
  )
  FROM public.tickets t
  JOIN public.user_profiles up ON t.user_id = up.id
  ORDER BY t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.ticket_all_tickets(INT, INT) TO authenticated;


-- Also fix ticket_my_tickets to include replies
DROP FUNCTION IF EXISTS public.ticket_my_tickets(INT, INT);

CREATE OR REPLACE FUNCTION public.ticket_my_tickets(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS SETOF jsonb AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'id', t.id,
    'subject', t.subject,
    'category', t.category,
    'status', t.status,
    'priority', t.priority,
    'createdAt', t.created_at,
    'updatedAt', t.updated_at,
    'replies', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', tr.id,
          'message', tr.message,
          'senderRole', tr.sender_role,
          'createdAt', tr.created_at
        ) ORDER BY tr.created_at ASC
      )
      FROM public.ticket_replies tr
      WHERE tr.ticket_id = t.id
    ), '[]'::jsonb)
  )
  FROM public.tickets t
  WHERE t.user_id = auth.uid()
  ORDER BY t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.ticket_my_tickets(INT, INT) TO authenticated;
