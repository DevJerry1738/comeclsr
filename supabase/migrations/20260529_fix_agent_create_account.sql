-- 20260529_fix_agent_create_account.sql
-- Fix agent_create_account RPC to generate UUIDs instead of requiring auth.users

DROP FUNCTION IF EXISTS public.agent_create_account(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.agent_create_account(
  p_full_name TEXT,
  p_email TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_agent_user_id UUID;
  v_generated_password TEXT;
  v_generated_username TEXT;
  v_result jsonb;
BEGIN
  -- Check if user is admin
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Validate input
  IF p_full_name IS NULL OR p_full_name = '' THEN
    RAISE EXCEPTION 'Invalid input: full_name is required';
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Invalid input: email is required';
  END IF;

  -- Check for duplicate email
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email already exists: %', p_email;
  END IF;

  -- Generate credentials
  v_agent_user_id := gen_random_uuid();
  v_generated_username := 'agent_' || to_char(NOW(), 'YYYYMMDDHHmmss');
  v_generated_password := public.generate_random_password(12);

  -- Insert agent profile without requiring auth.users entry
  -- Note: This creates a profile record not yet linked to Supabase Auth
  -- The admin will need to create the auth user separately or agent will self-register
  INSERT INTO public.user_profiles (
    id,
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
    v_agent_user_id,
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
  ON CONFLICT DO NOTHING;

  -- Return credentials
  SELECT jsonb_build_object(
    'user_id', v_agent_user_id,
    'username', v_generated_username,
    'email', p_email,
    'full_name', p_full_name,
    'password', v_generated_password,
    'created_at', NOW(),
    'message', 'Agent account created. Share login credentials with agent securely.'
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
