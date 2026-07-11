-- 20260624120000_agent_profile_and_delete.sql

-- 1. Add is_deleted column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- 2. Function to delete (soft delete) a message
CREATE OR REPLACE FUNCTION public.user_delete_message(p_message_id BIGINT)
RETURNS jsonb AS $$
DECLARE
  v_message record;
BEGIN
  -- Find the message
  SELECT * INTO v_message FROM public.messages WHERE id = p_message_id;
  
  IF v_message IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Check permission: MUST be the sender or an admin
  IF v_message.sender_id != auth.uid() AND NOT public.is_admin_check() THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own messages';
  END IF;

  -- Soft delete the message: update content and media, set is_deleted flag
  UPDATE public.messages
  SET 
    is_deleted = true,
    content = NULL,
    media_url = NULL,
    duration = NULL
  WHERE id = p_message_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function for agents to update their own profile
CREATE OR REPLACE FUNCTION public.agent_update_self_profile(
  p_full_name TEXT DEFAULT NULL,
  p_profile_photo TEXT DEFAULT NULL,
  p_age INT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_interests TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verify the requester is an agent
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'agent') THEN
    RAISE EXCEPTION 'Unauthorized: Agent role required';
  END IF;

  UPDATE public.user_profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    profile_photo = COALESCE(p_profile_photo, profile_photo),
    age = COALESCE(p_age, age),
    location = COALESCE(p_location, location),
    bio = COALESCE(p_bio, bio),
    interests = COALESCE(p_interests, interests),
    updated_at = NOW()
  WHERE id = auth.uid()
  RETURNING to_jsonb(public.user_profiles.*) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
