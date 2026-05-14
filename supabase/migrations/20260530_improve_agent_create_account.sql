-- 20260530_improve_agent_create_account.sql
-- Improve agent_create_account function with better error handling

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
  v_counter INT := 0;
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

  -- Check for duplicate email and fail explicitly
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE LOWER(email) = LOWER(p_email)) THEN
    RAISE EXCEPTION 'Email address already in use. Please use a different email.';
  END IF;

  -- Generate unique username with retry logic
  v_generated_username := 'agent_' || REPLACE(to_char(NOW(), 'YYYYMMDDHHmmss') || '_' || LPAD(to_char(FLOOR(RANDOM() * 1000)::INT), 3, '0'), '-', '');
  
  -- Retry if username already exists (unlikely but safe)
  WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE LOWER(username) = LOWER(v_generated_username)) AND v_counter < 5 LOOP
    v_generated_username := 'agent_' || REPLACE(to_char(NOW(), 'YYYYMMDDHHmmss') || '_' || LPAD(to_char(FLOOR(RANDOM() * 10000)::INT), 4, '0'), '-', '');
    v_counter := v_counter + 1;
  END LOOP;

  -- Generate credentials
  v_agent_user_id := gen_random_uuid();
  v_generated_password := public.generate_random_password(12);

  -- Insert agent profile
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
  );

  -- Return credentials
  v_result := jsonb_build_object(
    'user_id', v_agent_user_id,
    'username', v_generated_username,
    'email', p_email,
    'full_name', p_full_name,
    'password', v_generated_password,
    'created_at', NOW(),
    'message', 'Agent account created successfully. Share login credentials securely.'
  );

  RETURN v_result;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Conflict: Email or username already exists in the system.';
WHEN OTHERS THEN
  RAISE EXCEPTION 'Error creating agent account: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.agent_create_account(TEXT, TEXT) TO authenticated;
