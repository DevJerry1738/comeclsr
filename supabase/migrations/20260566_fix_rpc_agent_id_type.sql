-- Migration: Fix RPC function agent_id type mismatch
-- Issue 1: conversations.agent_id is BIGINT but agents.id is SERIAL (INTEGER)
--          causing type mismatch when RPC tries to return conversations.agent_id as INTEGER
-- Issue 2: agent_get_conversation_with_user in 20260557 declares agent_id as INTEGER
--          but earlier migration 20260556 correctly declared it as BIGINT
-- 
-- Solution: Fix the schema to make agents.id BIGINT using BIGSERIAL instead of SERIAL
--           Update all dependent type declarations

-- Step 1: Recreate agents table with BIGSERIAL
-- First, we need to drop the foreign keys that reference agents.id
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_assigned_agent_id_fkey;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_agent_id_fkey;

-- Step 2: Drop the agents table (this will cascade to conversations due to FK)
-- Actually, we can't do this because conversations has data. Instead, we'll:
-- - Create a new agents table with BIGSERIAL
-- - Copy data
-- - Drop old table
-- - Rename new table

-- Create new agents table with BIGSERIAL
CREATE TABLE public.agents_new (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  profile_photo TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  assigned_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Copy data from old agents table to new table
INSERT INTO public.agents_new (id, user_id, username, display_name, profile_photo, bio, status, assigned_user_id, created_at, updated_at)
SELECT id, user_id, username, display_name, profile_photo, bio, status, assigned_user_id, created_at, updated_at
FROM public.agents;

-- Update the sequence to the max id
SELECT setval('public.agents_new_id_seq', (SELECT MAX(id) FROM public.agents_new));

-- Drop old agents table
DROP TABLE IF EXISTS public.agents CASCADE;

-- Rename new table
ALTER TABLE public.agents_new RENAME TO agents;

-- Recreate foreign key constraints
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_assigned_agent_id_fkey
  FOREIGN KEY (assigned_agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;

-- Step 3: Fix RPC functions to use correct BIGINT type for agent_id

DROP FUNCTION IF EXISTS public.agent_get_conversation_with_user(UUID);
CREATE OR REPLACE FUNCTION public.agent_get_conversation_with_user(p_user_id UUID)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  agent_id BIGINT,
  status VARCHAR,
  admin_approved BOOLEAN,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP
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
    c.id,
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

-- Fix agent_get_self to use BIGINT for id
DROP FUNCTION IF EXISTS public.agent_get_self();
CREATE OR REPLACE FUNCTION public.agent_get_self()
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  display_name VARCHAR,
  username VARCHAR,
  bio TEXT,
  profile_photo TEXT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  RETURN QUERY
  SELECT a.id, a.user_id, a.display_name, a.username, a.bio, a.profile_photo
  FROM public.agents a
  WHERE a.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.agent_get_self() TO authenticated;

-- Ensure conversation_get_messages has correct return types
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

GRANT EXECUTE ON FUNCTION public.conversation_get_messages(BIGINT) TO authenticated;
