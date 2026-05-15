-- Migration: Fix ticket RPC function type mismatches
-- Issue: ticket_my_tickets and ticket_all_tickets declare id as BIGINT but tickets.id is SERIAL (INTEGER)

-- ============================================================================
-- FIX: ticket_my_tickets - Change id return type from BIGINT to INTEGER
-- ============================================================================
DROP FUNCTION IF EXISTS public.ticket_my_tickets(INT, INT);

CREATE OR REPLACE FUNCTION public.ticket_my_tickets(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
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
-- FIX: ticket_all_tickets - Change id return type from BIGINT to INTEGER
-- ============================================================================
DROP FUNCTION IF EXISTS public.ticket_all_tickets(INT, INT);

CREATE OR REPLACE FUNCTION public.ticket_all_tickets(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
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
