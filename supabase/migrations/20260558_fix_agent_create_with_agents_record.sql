-- 20260558_fix_agent_create_with_agents_record.sql
-- FIX: agent_create_account now also creates agents table record
-- This ensures conversations can be created when agent is assigned to a user

DROP FUNCTION IF EXISTS public.agent_create_account(TEXT, TEXT);
CREATE FUNCTION public.agent_create_account(
  p_full_name TEXT,
  p_email TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_agent_user_id UUID;
  v_generated_username TEXT;
  v_generated_password TEXT;
  v_result jsonb;
  v_agents_record_id INTEGER;
BEGIN
  IF p_full_name IS NULL OR p_full_name = '' THEN
    RAISE EXCEPTION 'Invalid input: full_name is required';
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Invalid input: email is required';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email already exists: %', p_email;
  END IF;

  v_generated_username := 'agent_' || to_char(NOW(), 'YYYYMMDDHHmmss');
  v_generated_password := public.generate_random_password(12);

  -- Create user profile
  INSERT INTO public.user_profiles (
    username,
    full_name,
    email,
    role,
    status,
    payment_status,
    kyc_status,
    created_at,
    updated_at
  )
  VALUES (
    v_generated_username,
    p_full_name,
    p_email,
    'agent',
    'active',
    'approved',
    'approved',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_agent_user_id;

  -- CRITICAL FIX: Also create agents table record
  -- This ensures agent_get_self() and conversation creation work properly
  INSERT INTO public.agents (
    user_id,
    username,
    display_name,
    bio,
    profile_photo,
    created_at,
    updated_at
  )
  VALUES (
    v_agent_user_id,
    v_generated_username,
    p_full_name,
    NULL,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_agents_record_id;

  SELECT jsonb_build_object(
    'agentUserId', v_agent_user_id,
    'username', v_generated_username,
    'email', p_email,
    'fullName', p_full_name,
    'password', v_generated_password,
    'agentsRecordId', v_agents_record_id,
    'createdAt', NOW(),
    'message', 'Agent account created with agents table record. Share login credentials with agent securely.'
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.agent_create_account(TEXT, TEXT) TO authenticated;
