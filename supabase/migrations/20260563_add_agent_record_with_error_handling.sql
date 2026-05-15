-- 20260563_add_agent_record_with_error_handling.sql
-- FIX: Improved admin_create_agent_record with comprehensive error handling and logging
-- Issue: Previous version might silently fail without proper error messages
-- Solution: Add EXCEPTION handling and verbose error logging

DROP FUNCTION IF EXISTS public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) CASCADE;

CREATE FUNCTION public.admin_create_agent_record(
  p_user_id UUID,
  p_username VARCHAR,
  p_display_name VARCHAR
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_agent_id UUID;
  v_error_message TEXT;
BEGIN
  -- Verify inputs
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id cannot be NULL';
  END IF;
  
  IF p_username IS NULL OR p_username = '' THEN
    RAISE EXCEPTION 'p_username cannot be NULL or empty';
  END IF;
  
  -- Verify user_profiles row exists
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', p_user_id;
  END IF;
  
  -- Check if agent already exists
  IF EXISTS (SELECT 1 FROM public.agents WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Agent record already exists for user_id: %', p_user_id;
  END IF;
  
  -- Check if username is already taken
  IF EXISTS (SELECT 1 FROM public.agents WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username already taken: %', p_username;
  END IF;

  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  INSERT INTO public.agents (
    user_id,
    username,
    display_name,
    bio,
    profile_photo,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_username,
    p_display_name,
    NULL,
    NULL,
    'active',
    NOW(),
    NOW()
  )
  RETURNING agents.id INTO v_agent_id;

  -- Build success response
  v_result := jsonb_build_object(
    'success', true,
    'id', v_agent_id,
    'user_id', p_user_id,
    'username', p_username,
    'message', 'Agent created successfully'
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  v_error_message := SQLSTATE || ': ' || SQLERRM;
  v_result := jsonb_build_object(
    'success', false,
    'error', v_error_message,
    'user_id', p_user_id,
    'username', p_username
  );
  
  -- Log the error for debugging
  RAISE WARNING 'admin_create_agent_record failed: %', v_error_message;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO anon;

-- Also update the seed-agent-auth function to handle the error response properly
