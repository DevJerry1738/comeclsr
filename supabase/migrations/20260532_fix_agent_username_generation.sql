-- 20260532_fix_agent_username_generation.sql
-- Fix the to_char(integer) error - integer needs to be cast to text

DROP FUNCTION IF EXISTS public.agent_create_account(TEXT, TEXT);

CREATE FUNCTION public.agent_create_account(
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
  PERFORM FROM public.user_profiles 
  WHERE id = auth.uid() AND role = 'admin' LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create agents' USING ERRCODE = '42501';
  END IF;

  -- Validate inputs
  IF p_full_name IS NULL OR p_full_name = '' THEN
    RAISE EXCEPTION 'Invalid input: full_name is required' USING ERRCODE = '22023';
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Invalid input: email is required' USING ERRCODE = '22023';
  END IF;

  -- Check for duplicate email
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE LOWER(email) = LOWER(p_email)) THEN
    RAISE EXCEPTION 'Email already in use' USING ERRCODE = '23505';
  END IF;

  -- Generate unique username (fixed: proper casting)
  v_generated_username := 'agent_' || to_char(NOW(), 'YYYYMMDDHHmmss') || '_' || LPAD((FLOOR(RANDOM() * 10000)::INT)::TEXT, 4, '0');
  
  WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE LOWER(username) = LOWER(v_generated_username)) AND v_counter < 10 LOOP
    v_generated_username := 'agent_' || LPAD((FLOOR(RANDOM() * 1000000)::INT)::TEXT, 6, '0');
    v_counter := v_counter + 1;
  END LOOP;

  -- Generate credentials
  v_agent_user_id := gen_random_uuid();
  v_generated_password := public.generate_random_password(12);

  -- Insert agent profile - DIRECTLY without RLS checks due to function owner permissions
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

  -- Return response with snake_case keys to match frontend expectations
  v_result := jsonb_build_object(
    'user_id', v_agent_user_id::text,
    'username', v_generated_username,
    'email', p_email,
    'full_name', p_full_name,
    'password', v_generated_password,
    'created_at', NOW()::text,
    'message', 'Agent account created successfully'
  );

  RETURN v_result;

EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Email or username conflict' USING ERRCODE = '23505';
WHEN OTHERS THEN
  RAISE EXCEPTION 'Error creating agent: %', SQLERRM USING ERRCODE = SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.agent_create_account(TEXT, TEXT) TO authenticated;
