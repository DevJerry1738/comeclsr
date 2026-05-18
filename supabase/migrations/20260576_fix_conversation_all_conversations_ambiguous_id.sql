-- Fix: conversation_all_conversations - ambiguous "id" column reference
-- PostgreSQL error 42702: "id" is ambiguous between the RETURNS TABLE output
-- variable and the conversations table column.
-- Solution: Explicitly CAST all columns to their declared types so PostgreSQL
-- resolves each column against the table, not the PL/pgSQL output variable.

DROP FUNCTION IF EXISTS public.conversation_all_conversations(INT, INT);

CREATE OR REPLACE FUNCTION public.conversation_all_conversations(
  p_limit  INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id               INTEGER,
  user_id          UUID,
  user_name        VARCHAR,
  agent_id         BIGINT,
  agent_name       VARCHAR,
  status           TEXT,
  admin_approved   BOOLEAN,
  last_message_at  TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    CAST(c.id              AS INTEGER),
    CAST(c.user_id         AS UUID),
    CAST(COALESCE(up.username, '')  AS VARCHAR),
    CAST(c.agent_id        AS BIGINT),
    CAST(COALESCE(up2.full_name, a.display_name, '') AS VARCHAR),
    CAST(c.status          AS TEXT),
    CAST(c.admin_approved  AS BOOLEAN),
    CAST(c.last_message_at AS TIMESTAMP WITH TIME ZONE),
    CAST(c.created_at      AS TIMESTAMP WITH TIME ZONE)
  FROM  public.conversations   c
  LEFT JOIN public.user_profiles up  ON up.id  = c.user_id
  LEFT JOIN public.agents        a   ON a.id   = c.agent_id
  LEFT JOIN public.user_profiles up2 ON up2.id = a.user_id
  WHERE (
    SELECT role = 'admin'
    FROM   public.user_profiles
    WHERE  id = auth.uid()
    LIMIT  1
  )
  ORDER BY c.last_message_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.conversation_all_conversations(INT, INT) TO authenticated;
