-- Migration: Add agent user notes for shared agent annotations

-- 1. Create table for agent user notes
CREATE TABLE IF NOT EXISTS public.agent_user_notes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  agent_id BIGINT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT agent_user_notes_content_max CHECK (char_length(content) <= 2000)
);

-- 2. Enable row level security on the new table
ALTER TABLE public.agent_user_notes ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for agent notes
DROP POLICY IF EXISTS "Agents can view user notes" ON public.agent_user_notes;
CREATE POLICY "Agents can view user notes"
  ON public.agent_user_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'agent'
    )
  );

DROP POLICY IF EXISTS "Agents can create user notes" ON public.agent_user_notes;
CREATE POLICY "Agents can create user notes"
  ON public.agent_user_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'agent'
    )
    AND agent_id = (
      SELECT id FROM public.agents WHERE user_id = auth.uid()
    )
  );

-- 4. Grant direct table privileges to authenticated if needed by client-side profiles
GRANT SELECT, INSERT ON public.agent_user_notes TO authenticated;

-- 5. RPC: fetch shared notes for a user
CREATE OR REPLACE FUNCTION public.agent_get_user_notes(p_user_id UUID)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  agent_id BIGINT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  author_display_name TEXT,
  author_profile_photo TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_is_agent BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  SELECT role = 'agent' INTO v_is_agent
  FROM public.user_profiles
  WHERE id = v_user_id;

  IF NOT v_is_agent THEN
    RAISE EXCEPTION 'Forbidden: Agent role required';
  END IF;

  RETURN QUERY
  SELECT
    n.id,
    n.user_id,
    n.agent_id,
    n.content,
    n.created_at,
    n.updated_at,
    COALESCE(a.display_name, up.full_name, 'Agent')::TEXT AS author_display_name,
    a.profile_photo AS author_profile_photo
  FROM public.agent_user_notes n
  LEFT JOIN public.agents a ON n.agent_id = a.id
  LEFT JOIN public.user_profiles up ON a.user_id = up.id
  WHERE n.user_id = p_user_id
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.agent_get_user_notes(UUID) TO authenticated;

-- 6. RPC: add a shared agent note for a user
CREATE OR REPLACE FUNCTION public.agent_add_user_note(p_user_id UUID, p_content TEXT)
RETURNS jsonb AS $$
DECLARE
  v_user_id UUID;
  v_agent_id BIGINT;
  v_note_id BIGINT;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  SELECT id INTO v_agent_id
  FROM public.agents
  WHERE user_id = v_user_id;

  IF v_agent_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden: Agent role required';
  END IF;

  IF p_content IS NULL OR char_length(trim(p_content)) = 0 THEN
    RAISE EXCEPTION 'Note content cannot be empty';
  END IF;

  IF char_length(p_content) > 2000 THEN
    RAISE EXCEPTION 'Note content must be 2000 characters or less';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE user_id = p_user_id AND agent_id = v_agent_id
  ) THEN
    RAISE EXCEPTION 'Forbidden: You are not assigned to this user';
  END IF;

  INSERT INTO public.agent_user_notes (user_id, agent_id, content)
  VALUES (p_user_id, v_agent_id, p_content)
  RETURNING id INTO v_note_id;

  SELECT jsonb_build_object(
    'id', n.id,
    'user_id', n.user_id,
    'agent_id', n.agent_id,
    'content', n.content,
    'created_at', n.created_at,
    'updated_at', n.updated_at,
    'author_display_name', COALESCE(up.full_name, a.display_name, 'Agent'),
    'author_profile_photo', COALESCE(up.profile_photo, a.profile_photo)
  ) INTO v_result
  FROM public.agent_user_notes n
  LEFT JOIN public.agents a ON n.agent_id = a.id
  LEFT JOIN public.user_profiles up ON a.user_id = up.id
  WHERE n.id = v_note_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.agent_add_user_note(UUID, TEXT) TO authenticated;
